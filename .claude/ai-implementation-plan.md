# Plan: AI Course Assistant Implementation

## Overview
Build a context-aware AI assistant that:
- Knows the user's course progress, achievements, and profile
- Can fetch lesson/module content on-demand via tools
- Can take actions (quiz, mark complete, create notes)
- Remembers context across sessions

## Your Current Data Structure
```
Course → Modules → Lessons (blocks: text, video, code, callout, image)
Enrollment: links user to course (no per-lesson progress yet)
```

## What Needs to Be Added

### Backend Models (new)
```python
# courses/models.py additions

class LessonProgress(models.Model):
    """Track per-lesson completion"""
    user = models.ForeignKey(User)
    lesson = models.ForeignKey(Lesson)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True)

class UserNote(models.Model):
    """User notes on lessons"""
    user = models.ForeignKey(User)
    lesson = models.ForeignKey(Lesson, null=True)  # null = general note
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Achievement(models.Model):
    """Gamification achievements"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)
    criteria = models.JSONField()  # e.g., {"type": "lessons_completed", "count": 10}

class UserAchievement(models.Model):
    user = models.ForeignKey(User)
    achievement = models.ForeignKey(Achievement)
    earned_at = models.DateTimeField(auto_now_add=True)

class UserProfile(models.Model):
    """Extended user info for AI context"""
    user = models.OneToOneField(User)
    business_type = models.CharField(max_length=100, blank=True)
    business_description = models.TextField(blank=True)
    goals = models.TextField(blank=True)
    ai_preferences = models.JSONField(default=dict)  # tone, verbosity, etc.

class ChatMessage(models.Model):
    """Persist chat history"""
    user = models.ForeignKey(User)
    role = models.CharField(max_length=20)  # 'user' or 'assistant'
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    # Optional: link to lesson context
    lesson = models.ForeignKey(Lesson, null=True, blank=True)
```

### Chat API Endpoint
```python
# courses/views.py or new chat/views.py

POST /api/v1/chat/
{
    "message": "Quiz me on module 3",
    "lesson_context": "lesson-slug"  # optional - what lesson they're viewing
}
```

## AI Architecture

### System Prompt (built per-request)
```
You are an AI tutor for [Course Name].

## Current User
- Name: {{user.first_name}}
- Business: {{profile.business_type}} - {{profile.business_description}}
- Goals: {{profile.goals}}

## Progress
- Enrolled in: {{enrolled_courses}}
- Current course: {{current_course.title}}
- Completed: {{completed_count}}/{{total_lessons}} lessons
- Achievements: {{achievements_list}}

## Available Tools
You have these tools to help the student:

1. `get_lesson_content(lesson_slug)` - Fetch full lesson content
2. `search_lessons(query)` - Search across all course content
3. `get_module_overview(module_id)` - Get module structure and lesson list
4. `mark_lesson_complete(lesson_slug)` - Mark a lesson as done
5. `create_note(content, lesson_slug?)` - Save a note for the user
6. `generate_quiz(topic, num_questions)` - Create a quiz on a topic
7. `get_user_notes(topic?)` - Retrieve user's saved notes

## Guidelines
- When asked about course content, use tools to fetch accurate info
- Reference specific lessons: "As covered in [Lesson Name]..."
- For quizzes, generate based on actual lesson content
- Celebrate achievements and encourage progress
```

### Tool Definitions (Vercel AI SDK)
```typescript
const tools = {
  get_lesson_content: {
    description: "Get the full content of a lesson by slug",
    parameters: z.object({
      lesson_slug: z.string()
    }),
    execute: async ({ lesson_slug }) => {
      // Call your API: GET /api/v1/courses/{course}/lessons/{lesson_slug}/
    }
  },

  search_lessons: {
    description: "Search course content for a topic",
    parameters: z.object({
      query: z.string()
    }),
    execute: async ({ query }) => {
      // Full-text search across lesson blocks
    }
  },

  mark_lesson_complete: {
    description: "Mark a lesson as completed for the user",
    parameters: z.object({
      lesson_slug: z.string()
    }),
    execute: async ({ lesson_slug }) => {
      // POST /api/v1/courses/progress/complete/
    }
  },

  generate_quiz: {
    description: "Generate a quiz on a topic based on course content",
    parameters: z.object({
      topic: z.string(),
      num_questions: z.number().default(5)
    }),
    execute: async ({ topic, num_questions }) => {
      // 1. Search for relevant lessons
      // 2. Return content + instruction for AI to generate questions
      // OR use a separate LLM call to generate quiz
    }
  },

  create_note: {
    description: "Save a note for the user",
    parameters: z.object({
      content: z.string(),
      lesson_slug: z.string().optional()
    }),
    execute: async ({ content, lesson_slug }) => {
      // POST /api/v1/notes/
    }
  }
};
```

## Implementation Order (when ready to build)

### Phase 1: Backend Foundation
1. Add new models: `LessonProgress`, `UserNote`, `UserProfile`, `ChatMessage`
2. Add `Achievement` + `UserAchievement` for gamification
3. Create migrations, run them
4. Add API endpoints:
   - `POST /api/v1/chat/` - main chat endpoint
   - `GET/POST /api/v1/progress/` - lesson progress
   - `GET/POST /api/v1/notes/` - user notes
   - `GET /api/v1/profile/` - user profile with business context

### Phase 2: Chat API
1. Install `anthropic` or `openai` SDK on backend (or use frontend with Vercel AI SDK)
2. Build system prompt generator that pulls user context
3. Define tools that call your existing course APIs
4. Implement `/api/v1/chat/` with tool execution loop
5. Persist messages to `ChatMessage` model

### Phase 3: Frontend Integration
1. Update `AIChatPanel` to call real API instead of mock
2. Add streaming support (Vercel AI SDK `useChat` hook)
3. Render tool calls nicely (show "Fetching lesson..." while tools run)
4. Add message persistence/loading

### Phase 4: Advanced Features
1. Quiz generation (AI generates based on lesson content)
2. Achievement triggers (check after each action)
3. Context-aware suggestions based on current lesson
4. User profile onboarding flow

## Key Files to Create/Modify

**Backend:**
- `backend/courses/models.py` - add new models
- `backend/chat/views.py` - new chat app or add to courses
- `backend/chat/tools.py` - tool definitions
- `backend/chat/prompt.py` - system prompt builder

**Frontend:**
- `src/components/chat/AIChatSidebar.tsx` - already exists, wire to real API
- `src/api/chat.ts` - new API client
- `src/hooks/useAIChat.ts` - chat state management

## Decision: Where to Run the LLM Call

**Option A: Backend (Django)**
- Pros: API keys stay on server, easier tool execution, can use async
- Cons: Need to add SDK, handle streaming

**Option B: Frontend (Vercel AI SDK)**
- Pros: Built-in streaming, `useChat` hook, nice DX
- Cons: Need API route (or serverless function), tools execute client-side or via API

**Recommendation:** Backend with streaming response. Your Django backend already handles auth and has access to all the data for tools.
