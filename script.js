// Get DOM elements
const topicInput = document.getElementById("topic");
const output = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");

// Button event listeners
document.getElementById("summarizeBtn").addEventListener("click", () => handleRequest("summarize"));
document.getElementById("quizBtn").addEventListener("click", () => handleRequest("quiz"));
document.getElementById("explainBtn").addEventListener("click", () => handleRequest("explain"));

// Copy button functionality
copyBtn.addEventListener("click", async () => {
    try {
        // Get the text content without HTML tags
        const textToCopy = output.innerText;
        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback - Set the full text and add class
        copyBtn.textContent = "✓ Copied!";
        copyBtn.classList.add("copied");

        // Reset button after 2 seconds
        setTimeout(() => {
            copyBtn.classList.remove("copied");
            copyBtn.textContent = "📋 Copy"; // Reset to original text and icon
        }, 2000);
    } catch (err) {
        console.error("Failed to copy text: ", err);
        copyBtn.textContent = "❌ Failed to copy";
        setTimeout(() => {
            copyBtn.textContent = "📋 Copy";
        }, 2000);
    }
});

// Main function to send request to the OpenRouter API
async function handleRequest(type) {
    const topic = topicInput.value.trim();
    const outputContainer = document.querySelector('.output-container');

    if (!topic) {
        output.textContent = "⚠️ Please enter a topic first.";
        copyBtn.style.display = "none";
        outputContainer.style.display = 'none'; // Ensure output container is hidden
        return;
    }

    // Show the output container and thinking message
    outputContainer.style.display = 'block';
    output.innerHTML = "⏳ Thinking...";
    copyBtn.style.display = "none";

    // Choose a prompt based on the button clicked
    let prompt;
    if (type === "summarize") {
        prompt = `Provide a comprehensive and detailed summary of "${topic}". Include the following aspects:
1. Key Concepts and Definitions
2. Main Components/Principles
3. Historical Context (if relevant)
4. Real-world Applications
5. Important Examples
6. Related Concepts
7. Common Misconceptions
8. Key Takeaways

Format the response in clear sections with headings. Make it detailed enough for a thorough understanding while keeping it well-organized and easy to follow.`;
    } else if (type === "quiz") {
        prompt = `Create a 10-question quiz about "${topic}". Format it as follows:

1. Start with a brief introduction to the topic
2. List 10 multiple-choice questions
3. For each question:
   - The question text
   - 4 possible answers (A, B, C, D)
   - The correct answer
   - A brief explanation of why it's correct
4. End with a conclusion

Make the questions challenging but fair, and ensure they cover different aspects of the topic.`;
    } else if (type === "explain") {
        prompt = `Explain the topic "${topic}" in simple terms, as if explaining it to a 10-year-old. Include:

1. A simple definition
2. A real-world analogy or example
3. Why it's important or interesting
4. How it relates to things they might already know
5. Fun facts or interesting tidbits

Use simple language, avoid jargon, and make it engaging and easy to understand.`;
    }

    const messages = [
        { role: "system", content: "You are a helpful AI study assistant. Provide clear, well-structured responses using markdown formatting." },
        { role: "user", content: prompt }
    ];

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer ",
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
                "X-Title": "AI Study Assistant"
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-prover-v2:free",
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}`);
        }

        const data = await res.json();

        if (data.choices && data.choices.length > 0) {
            let rawMarkdown = data.choices[0].message.content.trim();

            // Remove triple backticks if present
            if (rawMarkdown.startsWith("```") && rawMarkdown.endsWith("```")) {
                rawMarkdown = rawMarkdown.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
            }

            const markdownHTML = marked.parse(rawMarkdown);
            output.innerHTML = typeof DOMPurify !== "undefined"
                ? DOMPurify.sanitize(markdownHTML)
                : markdownHTML;

            // Show copy button and set initial text
            copyBtn.style.display = "flex";
            copyBtn.textContent = "📋 Copy";
        } else {
            throw new Error("No response from AI model");
        }
    } catch (error) {
        console.error("Error:", error);
        output.innerHTML = `<p class="error">❌ Error: ${error.message}. Please try again later.</p>`;
        copyBtn.style.display = "none";
    }
}

// Add enter key support for the input field
topicInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.getElementById("summarizeBtn").click();
    }
});
