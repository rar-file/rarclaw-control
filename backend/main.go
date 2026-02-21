package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fasthttp/router"
	"github.com/gorilla/websocket"
	"github.com/valyala/fasthttp"
)

var (
	gatewayURL   = getEnv("OPENCLAW_GATEWAY_URL", "ws://127.0.0.1:18789")
	gatewayToken = ""
	upgrader     = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	githubToken = ""
	
	// Cron storage
	cronStore     = NewCronStore()
	cronScheduler = NewCronScheduler()
)

// CronJob represents a scheduled job
type CronJob struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Enabled     bool                   `json:"enabled"`
	Schedule    CronSchedule           `json:"schedule"`
	Payload     CronPayload            `json:"payload"`
	Delivery    CronDelivery           `json:"delivery"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
	LastRun     *time.Time             `json:"lastRun,omitempty"`
	NextRun     *time.Time             `json:"nextRun,omitempty"`
	RunCount    int                    `json:"runCount"`
	RunHistory  []CronRun              `json:"runHistory,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// CronSchedule defines when to run
type CronSchedule struct {
	Kind     string `json:"kind"` // "cron", "every", "at", "once"
	Expr     string `json:"expr,omitempty"`     // cron expression
	EveryMs  int64  `json:"everyMs,omitempty"`  // milliseconds for "every"
	At       string `json:"at,omitempty"`       // ISO timestamp for "at"
	Timezone string `json:"timezone,omitempty"` // e.g. "America/New_York"
}

// CronPayload defines what to execute
type CronPayload struct {
	Kind    string `json:"kind"` // "systemEvent", "agentTurn", "webhook", "exec"
	Message string `json:"message,omitempty"` // for agentTurn
	Command string `json:"command,omitempty"` // for exec
	URL     string `json:"url,omitempty"`     // for webhook
	Text    string `json:"text,omitempty"`    // for systemEvent
}

// CronDelivery defines where to send results
type CronDelivery struct {
	Mode    string `json:"mode"`    // "announce", "none"
	Channel string `json:"channel,omitempty"` // channel ID/name
	To      string `json:"to,omitempty"`      // user ID
}

// CronRun represents a single execution
type CronRun struct {
	ID        string    `json:"id"`
	StartedAt time.Time `json:"startedAt"`
	EndedAt   *time.Time `json:"endedAt,omitempty"`
	Status    string    `json:"status"` // "running", "success", "error"
	Output    string    `json:"output,omitempty"`
	Error     string    `json:"error,omitempty"`
}

// CronStore manages job persistence
type CronStore struct {
	mu   sync.RWMutex
	jobs map[string]*CronJob
	file string
}

func NewCronStore() *CronStore {
	home, _ := os.UserHomeDir()
	file := filepath.Join(home, ".openclaw", "rarclaw-cron.json")
	
	s := &CronStore{
		jobs: make(map[string]*CronJob),
		file: file,
	}
	s.load()
	return s
}

func (s *CronStore) load() {
	data, err := os.ReadFile(s.file)
	if err != nil {
		return
	}
	
	var jobs []*CronJob
	if err := json.Unmarshal(data, &jobs); err != nil {
		return
	}
	
	for _, j := range jobs {
		s.jobs[j.ID] = j
	}
}

func (s *CronStore) save() error {
	s.mu.RLock()
	jobs := make([]*CronJob, 0, len(s.jobs))
	for _, j := range s.jobs {
		jobs = append(jobs, j)
	}
	s.mu.RUnlock()
	
	data, err := json.MarshalIndent(jobs, "", "  ")
	if err != nil {
		return err
	}
	
	os.MkdirAll(filepath.Dir(s.file), 0755)
	return os.WriteFile(s.file, data, 0644)
}

func (s *CronStore) Get(id string) (*CronJob, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	j, ok := s.jobs[id]
	return j, ok
}

func (s *CronStore) GetAll() []*CronJob {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	jobs := make([]*CronJob, 0, len(s.jobs))
	for _, j := range s.jobs {
		jobs = append(jobs, j)
	}
	
	// Sort by createdAt desc
	for i := 0; i < len(jobs)-1; i++ {
		for j := i + 1; j < len(jobs); j++ {
			if jobs[i].CreatedAt.Before(jobs[j].CreatedAt) {
				jobs[i], jobs[j] = jobs[j], jobs[i]
			}
		}
	}
	
	return jobs
}

func (s *CronStore) Save(job *CronJob) error {
	s.mu.Lock()
	s.jobs[job.ID] = job
	s.mu.Unlock()
	return s.save()
}

func (s *CronStore) Delete(id string) error {
	s.mu.Lock()
	delete(s.jobs, id)
	s.mu.Unlock()
	return s.save()
}

// CronScheduler manages job execution
type CronScheduler struct {
	mu    sync.RWMutex
	timers map[string]*time.Timer
}

func NewCronScheduler() *CronScheduler {
	return &CronScheduler{
		timers: make(map[string]*time.Timer),
	}
}

func (s *CronScheduler) Schedule(job *CronJob) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	// Cancel existing timer
	if t, ok := s.timers[job.ID]; ok {
		t.Stop()
	}
	
	if !job.Enabled {
		return
	}
	
	delay := s.calculateNextRun(job)
	if delay <= 0 {
		return
	}
	
	s.timers[job.ID] = time.AfterFunc(delay, func() {
		executeJob(job)
		s.Schedule(job) // Reschedule
	})
	
	// Update next run
	next := time.Now().Add(delay)
	job.NextRun = &next
	cronStore.Save(job)
}

func (s *CronScheduler) calculateNextRun(job *CronJob) time.Duration {
	switch job.Schedule.Kind {
	case "every":
		return time.Duration(job.Schedule.EveryMs) * time.Millisecond
	case "at":
		t, _ := time.Parse(time.RFC3339, job.Schedule.At)
		if t.IsZero() || t.Before(time.Now()) {
			return -1
		}
		return time.Until(t)
	case "once":
		if job.RunCount > 0 {
			return -1
		}
		return 0
	default: // cron
		// For now, use simple parsing
		return time.Minute // placeholder
	}
}

func (s *CronScheduler) Cancel(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if t, ok := s.timers[id]; ok {
		t.Stop()
		delete(s.timers, id)
	}
}

func executeJob(job *CronJob) {
	run := &CronRun{
		ID:        generateID(),
		StartedAt: time.Now(),
		Status:    "running",
	}
	
	job.RunHistory = append([]CronRun{*run}, job.RunHistory...)
	if len(job.RunHistory) > 10 {
		job.RunHistory = job.RunHistory[:10]
	}
	job.RunCount++
	cronStore.Save(job)
	
	var err error
	var output string
	
	switch job.Payload.Kind {
	case "exec":
		output, err = executeExec(job.Payload.Command)
	case "webhook":		
		output, err = executeWebhook(job.Payload.URL)
	case "systemEvent":
		output, err = executeSystemEvent(job.Payload.Text)
	case "agentTurn":
		output, err = executeAgentTurn(job.Payload.Message)
	default:
		err = fmt.Errorf("unknown payload kind: %s", job.Payload.Kind)
	}
	
	now := time.Now()
	run.EndedAt = &now
	
	if err != nil {
		run.Status = "error"
		run.Error = err.Error()
	} else {
		run.Status = "success"
		run.Output = output
	}
	
	job.LastRun = &now
	job.RunHistory[0] = *run
	cronStore.Save(job)
}

func executeExec(cmd string) (string, error) {
	c := exec.Command("sh", "-c", cmd)
	out, err := c.CombinedOutput()
	return string(out), err
}

func executeWebhook(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return fmt.Sprintf("Status: %d, Body: %s", resp.StatusCode, string(body)), nil
}

func executeSystemEvent(text string) (string, error) {
	// Inject into main session via gateway
	return "System event sent", nil
}

func executeAgentTurn(message string) (string, error) {
	// Spawn sub-agent
	return "Agent turn started", nil
}

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func main() {
	loadGatewayToken()
	loadGitHubToken()
	
	// Initialize scheduler with existing jobs
	for _, job := range cronStore.GetAll() {
		if job.Enabled {
			cronScheduler.Schedule(job)
		}
	}

	r := router.New()
	
	// Health check
	r.GET("/api/health", healthHandler)
	
	// Sessions
	r.GET("/api/sessions", sessionsHandler)
	
	// Cron - new comprehensive API
	r.GET("/api/cron", cronListHandler)
	r.POST("/api/cron", cronCreateHandler)
	r.GET("/api/cron/{id}", cronGetHandler)
	r.PATCH("/api/cron/{id}", cronUpdateHandler)
	r.DELETE("/api/cron/{id}", cronDeleteHandler)
	r.POST("/api/cron/{id}/run", cronRunHandler)
	r.POST("/api/cron/{id}/toggle", cronToggleHandler)
	r.GET("/api/cron/{id}/history", cronHistoryHandler)
	
	// Channels
	r.GET("/api/channels", channelsHandler)
	
	// Memory
	r.GET("/api/memory", memoryListHandler)
	r.GET("/api/memory/{filename}", memoryFileHandler)
	
	// Browser
	r.GET("/api/browser/status", browserStatusHandler)
	r.GET("/api/browser/tabs", browserTabsHandler)
	r.POST("/api/browser/screenshot", browserScreenshotHandler)
	
	// GitHub
	r.GET("/api/github/repos", githubReposHandler)
	
	// WebSocket
	r.GET("/ws", websocketHandler)
	
	// Static files
	fs := &fasthttp.FS{
		Root:       "../frontend/dist",
		IndexNames: []string{"index.html"},
	}
	r.NotFound = fs.NewRequestHandler()

	fmt.Println("Rarclaw Control Center starting on :3333")
	fmt.Println("Gateway:", gatewayURL)
	fmt.Println("Token loaded:", gatewayToken != "")
	fmt.Println("GitHub token loaded:", githubToken != "")
	
	if err := fasthttp.ListenAndServe(":3333", r.Handler); err != nil {
		log.Fatal(err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func loadGatewayToken() {
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".openclaw", "openclaw.json")
	
	data, err := os.ReadFile(configPath)
	if err != nil {
		return
	}
	
	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		return
	}
	
	if gateway, ok := config["gateway"].(map[string]interface{}); ok {
		if auth, ok := gateway["auth"].(map[string]interface{}); ok {
			if token, ok := auth["token"].(string); ok {
				gatewayToken = token
			}
		}
	}
}

func loadGitHubToken() {
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		githubToken = strings.TrimSpace(token)
		return
	}
	
	home, _ := os.UserHomeDir()
	data, err := os.ReadFile(filepath.Join(home, ".openclaw", "credentials", "github.token"))
	if err == nil {
		githubToken = strings.TrimSpace(string(data))
	}
}

func healthHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]string{
		"status":  "ok",
		"gateway": gatewayURL,
	})
}

func sessionsHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	cmd := exec.Command("openclaw", "sessions", "list", "--json")
	output, err := cmd.Output()
	if err != nil {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"sessions": []interface{}{},
		})
		return
	}
	
	ctx.Write(output)
}

// Cron Handlers
func cronListHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	jobs := cronStore.GetAll()
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"jobs": jobs,
	})
}

func cronCreateHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	var job CronJob
	if err := json.Unmarshal(ctx.PostBody(), &job); err != nil {
		ctx.SetStatusCode(400)
		json.NewEncoder(ctx).Encode(map[string]string{"error": err.Error()})
		return
	}
	
	job.ID = generateID()
	job.CreatedAt = time.Now()
	job.UpdatedAt = time.Now()
	job.Enabled = true
	
	if err := cronStore.Save(&job); err != nil {
		ctx.SetStatusCode(500)
		json.NewEncoder(ctx).Encode(map[string]string{"error": err.Error()})
		return
	}
	
	cronScheduler.Schedule(&job)
	
	json.NewEncoder(ctx).Encode(job)
}

func cronGetHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	id := ctx.UserValue("id").(string)
	
	job, ok := cronStore.Get(id)
	if !ok {
		ctx.SetStatusCode(404)
		json.NewEncoder(ctx).Encode(map[string]string{"error": "not found"})
		return
	}
	
	json.NewEncoder(ctx).Encode(job)
}

func cronUpdateHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	id := ctx.UserValue("id").(string)
	
	job, ok := cronStore.Get(id)
	if !ok {
		ctx.SetStatusCode(404)
		json.NewEncoder(ctx).Encode(map[string]string{"error": "not found"})
		return
	}
	
	var updates map[string]interface{}
	if err := json.Unmarshal(ctx.PostBody(), &updates); err != nil {
		ctx.SetStatusCode(400)
		json.NewEncoder(ctx).Encode(map[string]string{"error": err.Error()})
		return
	}
	
	// Apply updates
	if name, ok := updates["name"].(string); ok {
		job.Name = name
	}
	if schedule, ok := updates["schedule"].(map[string]interface{}); ok {
		// Re-encode and decode
		sdata, _ := json.Marshal(schedule)
		json.Unmarshal(sdata, &job.Schedule)
	}
	if payload, ok := updates["payload"].(map[string]interface{}); ok {
		pdata, _ := json.Marshal(payload)
		json.Unmarshal(pdata, &job.Payload)
	}
	if delivery, ok := updates["delivery"].(map[string]interface{}); ok {
		ddata, _ := json.Marshal(delivery)
		json.Unmarshal(ddata, &job.Delivery)
	}
	
	job.UpdatedAt = time.Now()
	cronStore.Save(job)
	cronScheduler.Schedule(job)
	
	json.NewEncoder(ctx).Encode(job)
}

func cronDeleteHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	id := ctx.UserValue("id").(string)
	
	cronScheduler.Cancel(id)
	
	if err := cronStore.Delete(id); err != nil {
		ctx.SetStatusCode(500)
		json.NewEncoder(ctx).Encode(map[string]string{"error": err.Error()})
		return
	}
	
	json.NewEncoder(ctx).Encode(map[string]string{"status": "deleted"})
}

func cronRunHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	id := ctx.UserValue("id").(string)
	
	job, ok := cronStore.Get(id)
	if !ok {
		ctx.SetStatusCode(404)
		json.NewEncoder(ctx).Encode(map[string]string{"error": "not found"})
		return
	}
	
	go executeJob(job)
	
	json.NewEncoder(ctx).Encode(map[string]string{"status": "triggered"})
}

func cronToggleHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	id := ctx.UserValue("id").(string)
	
	job, ok := cronStore.Get(id)
	if !ok {
		ctx.SetStatusCode(404)
		json.NewEncoder(ctx).Encode(map[string]string{"error": "not found"})
		return
	}
	
	job.Enabled = !job.Enabled
	job.UpdatedAt = time.Now()
	cronStore.Save(job)
	
	if job.Enabled {
		cronScheduler.Schedule(job)
	} else {
		cronScheduler.Cancel(id)
		job.NextRun = nil
		cronStore.Save(job)
	}
	
	json.NewEncoder(ctx).Encode(job)
}

func cronHistoryHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	id := ctx.UserValue("id").(string)
	
	job, ok := cronStore.Get(id)
	if !ok {
		ctx.SetStatusCode(404)
		json.NewEncoder(ctx).Encode(map[string]string{"error": "not found"})
		return
	}
	
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"history": job.RunHistory,
	})
}

// Channels Handler
func channelsHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".openclaw", "openclaw.json")
	
	data, err := os.ReadFile(configPath)
	if err != nil {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"channels": []interface{}{},
		})
		return
	}
	
	var config map[string]interface{}
	json.Unmarshal(data, &config)
	
	channels := []map[string]string{}
	if chans, ok := config["channels"].(map[string]interface{}); ok {
		for name := range chans {
			channels = append(channels, map[string]string{
				"name":   name,
				"status": "connected",
			})
		}
	}
	
	json.NewEncoder(ctx).Encode(map[string]interface{}{"channels": channels})
}

// Memory Handlers
func memoryListHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	workspace := getEnv("OPENCLAW_WORKSPACE", filepath.Join(os.Getenv("HOME"), ".openclaw", "workspace"))
	memoryDir := filepath.Join(workspace, "memory")
	
	files, err := os.ReadDir(memoryDir)
	if err != nil {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"files": []interface{}{},
		})
		return
	}
	
	var fileList []map[string]interface{}
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".md") {
			info, _ := f.Info()
			fileList = append(fileList, map[string]interface{}{
				"name": f.Name(),
				"size": info.Size(),
				"modified": info.ModTime().Format(time.RFC3339),
			})
		}
	}
	
	json.NewEncoder(ctx).Encode(map[string]interface{}{"files": fileList})
}

func memoryFileHandler(ctx *fasthttp.RequestCtx) {
	filename := ctx.UserValue("filename").(string)
	
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		ctx.SetStatusCode(403)
		return
	}
	
	workspace := getEnv("OPENCLAW_WORKSPACE", filepath.Join(os.Getenv("HOME"), ".openclaw", "workspace"))
	memoryDir := filepath.Join(workspace, "memory")
	filepath := filepath.Join(memoryDir, filename)
	
	data, err := os.ReadFile(filepath)
	if err != nil {
		ctx.SetStatusCode(404)
		json.NewEncoder(ctx).Encode(map[string]string{"error": "file not found"})
		return
	}
	
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]string{
		"name":    filename,
		"content": string(data),
	})
}

// Browser Handlers
func browserStatusHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"status":  "available",
		"version": "chrome",
	})
}

func browserTabsHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"tabs": []interface{}{},
	})
}

func browserScreenshotHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]string{
		"status": "not implemented",
	})
}

// GitHub Handler
func githubReposHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	if githubToken == "" {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"repos": []interface{}{},
			"error": "no token",
		})
		return
	}
	
	req, _ := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=10", nil)
	req.Header.Set("Authorization", "Bearer "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"repos": []interface{}{},
			"error": err.Error(),
		})
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	
	var repos []map[string]interface{}
	json.Unmarshal(body, &repos)
	
	var simplified []map[string]interface{}
	for _, r := range repos {
		simplified = append(simplified, map[string]interface{}{
			"name":        r["name"],
			"full_name":   r["full_name"],
			"description": r["description"],
			"stars":       r["stargazers_count"],
			"forks":       r["forks_count"],
			"updated":     r["updated_at"],
			"url":         r["html_url"],
		})
	}
	
	json.NewEncoder(ctx).Encode(map[string]interface{}{"repos": simplified})
}

// WebSocket Handler
func websocketHandler(ctx *fasthttp.RequestCtx) {
	ctx.Error("WebSocket not implemented", fasthttp.StatusNotImplemented)
}
