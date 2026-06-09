# Groq API Limits & Production Scaling Guide

## Overview

This document outlines:

* Groq free-tier limitations
* How token consumption grows over time
* Risks when deploying a portfolio chatbot to production
* Strategies to control API usage and costs
* Production-ready recommendations

---

# Current Architecture

Current chatbot flow:

```text
User Message
      ↓
Conversation History
      ↓
System Prompt
      ↓
Groq API
      ↓
AI Response
```

Each request sends:

* System Prompt
* Previous Conversation
* Current User Message

The larger the conversation becomes, the more tokens are consumed.

---

# Groq Free Tier Limits

## Llama 4 Scout (Recommended)

| Metric                    | Limit   |
| ------------------------- | ------- |
| Requests Per Minute (RPM) | 30      |
| Requests Per Day (RPD)    | 1,000   |
| Tokens Per Minute (TPM)   | 30,000  |
| Tokens Per Day (TPD)      | 500,000 |

---

# Understanding Token Consumption

Example request:

```text
System Prompt        300 tokens
Chat History         600 tokens
User Message          50 tokens
Response             200 tokens
-----------------------------
Total               1150 tokens
```

Single request cost:

```text
~1150 tokens
```

---

# Real Usage Calculation

Assume:

```text
Average Request = 1500 tokens
```

Daily limit:

```text
500,000 tokens
```

Possible requests:

```text
500,000 / 1500

≈ 333 requests/day
```

For a portfolio website:

* More than sufficient initially
* Enough for recruiter demos
* Enough for moderate traffic

---

# Current Local Testing Metrics

Observed:

```text
Prompt Tokens:
510
610
745
824
965
1146
```

Growth:

```text
~100-150 tokens per conversation turn
```

This indicates the chatbot is sending full conversation history.

Current usage is healthy and far below Groq limits.

---

# Production Risks

## Risk #1: Conversation Growth

Example:

```text
Turn 1  = 500 tokens
Turn 10 = 1200 tokens
Turn 30 = 4000+ tokens
Turn 100 = 12000+ tokens
```

Problem:

* Slower responses
* Higher token consumption
* Reduced daily capacity

---

## Risk #2: Large Context Injection

Bad approach:

```text
Resume Data
Project Data
Run2Feed Data
Experience Data
Skills Data
Conversation
```

Every request:

```text
5000-10000 tokens
```

This can consume the daily quota quickly.

---

## Risk #3: Spam or Abuse

Public portfolio websites are accessible to everyone.

Potential abuse:

* Automated requests
* Prompt spam
* Scripted attacks

Can rapidly exhaust daily limits.

---

# Production Mitigation Strategies

## Strategy 1: Limit Conversation Length

Keep only recent messages.

Example:

```javascript
messages.slice(-10);
```

Store:

* Last 10 messages
* Discard older messages

Benefits:

* Predictable token usage
* Faster responses

---

## Strategy 2: Conversation Summarization

Instead of:

```text
100 previous messages
```

Store:

```text
Conversation Summary
+
Last 10 messages
```

Example:

```text
Summary:
User is interested in React projects,
Run2Feed, and portfolio architecture.
```

Benefits:

* Preserves context
* Dramatically reduces token consumption

---

## Strategy 3: Retrieval-Based Context

Instead of injecting everything:

```text
Resume
Projects
Experience
Skills
Run2Feed
```

Retrieve only relevant content.

Example:

User asks:

```text
Tell me about Run2Feed
```

Inject:

```text
run2feed.md
```

Only.

Benefits:

* Massive token savings
* Better response quality

---

## Strategy 4: Rate Limiting

Implement per-IP rate limits.

Suggested:

```text
10 requests/minute
50 requests/hour
```

Tools:

* Upstash Redis
* Cloudflare Rate Limiting
* Express Rate Limit

Benefits:

* Prevents abuse
* Protects quota

---

## Strategy 5: Response Length Limits

Current responses may generate unnecessary tokens.

Recommended:

```javascript
max_completion_tokens: 300
```

Benefits:

* Consistent response size
* Reduced token usage

---

## Strategy 6: Cache Common Questions

Examples:

```text
Who is Hrishikesh?
Tell me about Run2Feed.
What technologies do you use?
Show your projects.
```

Store responses in cache.

Benefits:

* Zero AI calls
* Faster response times

Possible technologies:

* Redis
* Vercel KV
* Memory Cache

---

# Monitoring

Log the following metrics:

```text
Timestamp
IP Address
Conversation Turns
Prompt Tokens
Completion Tokens
Total Tokens
Response Time
Model Used
```

Example:

```text
[Prompt Tokens]: 1146
[Completion Tokens]: 182
[Total Tokens]: 1328
[Model]: llama-4-scout
[Latency]: 1382ms
```

---

# Alert Thresholds

Recommended monitoring:

## Warning

```text
300,000 tokens/day
```

Send notification.

---

## Critical

```text
450,000 tokens/day
```

Enable aggressive limits.

---

## Emergency

```text
490,000 tokens/day
```

Disable chatbot temporarily.

---

# Future Scaling Path

## Phase 1

Current State

```text
Portfolio
+
Groq Free Tier
```

Expected users:

```text
0-50 users/day
```

---

## Phase 2

Add:

```text
Rate Limiting
Caching
Conversation Limits
```

Expected users:

```text
50-500 users/day
```

---

## Phase 3

Add:

```text
Vector Database
RAG
Redis Cache
Conversation Summaries
```

Expected users:

```text
500+ users/day
```

---

# Recommended Production Setup

```text
Next.js Frontend
        ↓
API Route
        ↓
Rate Limiter
        ↓
Cache Layer
        ↓
Knowledge Retrieval
        ↓
Groq API
        ↓
Response
```

This architecture minimizes token usage while maintaining response quality.

---

# Final Recommendation

For the current portfolio chatbot:

* Groq Free Tier is sufficient.
* Current token usage is healthy.
* The biggest future risk is conversation history growth, not Groq limits.
* Prioritize:

  1. Conversation truncation
  2. Rate limiting
  3. Retrieval-based context
  4. Response caching

With these controls in place, the chatbot can comfortably support real production traffic while remaining within Groq free-tier limits.
