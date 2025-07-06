package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found or couldn't be loaded")
	}
	http.HandleFunc("/search", proxyTo("http://function-search:3000/search"))
	http.HandleFunc("/mcp", handleMCP)
	log.Println("API Gateway running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func proxyTo(url string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, url, http.StatusTemporaryRedirect)
	}
}

func handleMCP(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Query string `json:"query"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	intent := make(map[string]string)
	openaiKey := os.Getenv("OPENAI_API_KEY")
	gamebrainKey := os.Getenv("GAMEBRAIN_API_KEY")
	gamebrainURL := "https://api.gamebrain.co/v1/mcp?api-key=" + gamebrainKey

	success := false

	// Try OpenAI if API key is set
	if openaiKey != "" {
		prompt := `
You're an intent extractor for a video game search platform. Given a user's query, output JSON like one of:

{"action": "search", "query": "sci-fi RPGs"}
{"action": "similar", "title": "Baldur's Gate"}
{"action": "suggest", "prefix": "zel"}

Query: ` + body.Query + `
Return only the JSON.`

		reqBody := map[string]interface{}{
			"model": "gpt-3.5-turbo",
			"messages": []map[string]string{
				{"role": "system", "content": "You are a JSON API intent extractor."},
				{"role": "user", "content": prompt},
			},
		}
		jsonBody, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+openaiKey)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			bodyBytes, _ := io.ReadAll(resp.Body)
			log.Println("📥 OpenAI raw response:", string(bodyBytes))

			var result struct {
				Choices []struct {
					Message struct {
						Content string `json:"content"`
					} `json:"message"`
				} `json:"choices"`
			}
			json.Unmarshal(bodyBytes, &result)

			if len(result.Choices) > 0 {
				if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &intent); err == nil {
					success = true
				}
			}
		}
	}

	// If OpenAI failed or not configured, fall back to GameBrain
	if !success {
		log.Println("⚠️ Falling back to GameBrain")

		cmd := exec.Command("npx", "-y", "mcp-remote", gamebrainURL)
		cmd.Env = append(os.Environ(), "GAMEBRAIN_API_KEY="+gamebrainKey)

		stdin, _ := cmd.StdinPipe()
		go func() {
			defer stdin.Close()
			queryJSON, _ := json.Marshal(map[string]string{"query": body.Query})
			stdin.Write(queryJSON)
		}()

		output, err := cmd.Output()
		if err != nil {
			log.Println("❌ GameBrain MCP failed:", err)
			http.Error(w, "Failed to contact GameBrain MCP", 500)
			return
		}
		log.Println("📦 GameBrain raw output:", string(output))

		if err := json.Unmarshal(output, &intent); err != nil {
			http.Error(w, "Invalid GameBrain response", 500)
			return
		}
	}

	// Route to appropriate internal function
	var targetURL string
	switch intent["action"] {
	case "search":
		targetURL = "http://function-search:3000/search"
	case "suggest":
		targetURL = "http://function-suggest:3002/suggest"
	case "similar":
		targetURL = "http://function-similar:3001/similar"
	default:
		http.Error(w, "Unknown action", 400)
		return
	}

	finalBody, _ := json.Marshal(intent)
	resp2, err := http.Post(targetURL, "application/json", bytes.NewBuffer(finalBody))
	if err != nil {
		http.Error(w, "Failed to contact internal function", 500)
		return
	}
	defer resp2.Body.Close()
	io.Copy(w, resp2.Body)
}
