import { getCSRFToken } from '@/lib/getCookie';

const API_BASE = '/api/v1/courses';

export interface LessonBlock {
  id: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

export interface BunnyVideo {
  id: number;
  guid: string;
  title: string;
  duration_seconds: number | null;
  thumbnail_url: string;
  thumbnail_blurhash?: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  file_size_bytes: number | null;
  created_at: string;
}

export interface Lesson {
  id: number;
  title: string;
  slug: string;
  content?: string;
  blocks?: LessonBlock[];
  video_url?: string;
  bunny_video?: BunnyVideo | null;
  signed_video_url?: string | null;
  duration_minutes: number;
  order: number;
  is_free_preview: boolean;
  has_video?: boolean;
}

export interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface CoursePrerequisite {
  id: number;
  required_course_id: number;
  required_course_title: string;
  required_course_slug: string;
  enforcement: 'recommended' | 'required';
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  long_description?: string;
  thumbnail_url?: string;
  saleor_product_id?: string;
  total_lessons: number;
  total_duration_minutes: number;
  modules?: Module[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  learning_objectives?: string[];
  tags?: Tag[];
  prerequisites?: CoursePrerequisite[];
  created_at: string;
  updated_at?: string;
}

export interface Enrollment {
  id: number;
  course: Course;
  enrolled_at: string;
  saleor_order_id: string;
}

export interface CourseStructure {
  course: {
    id: number;
    title: string;
    slug: string;
    description?: string;
    long_description?: string;
    thumbnail_url?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
    learning_objectives?: string[];
    tags?: Tag[];
    prerequisites?: CoursePrerequisite[];
  };
  is_enrolled: boolean;
  modules: Module[];
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchCourses(): Promise<Course[]> {
  return fetchWithAuth(API_BASE + '/');
}

export async function fetchCourse(slug: string): Promise<Course> {
  return fetchWithAuth(`${API_BASE}/${slug}/`);
}

export async function fetchCourseStructure(slug: string): Promise<CourseStructure> {
  return fetchWithAuth(`${API_BASE}/${slug}/structure/`);
}

export async function fetchLesson(courseSlug: string, lessonSlug: string): Promise<Lesson> {
  return fetchWithAuth(`${API_BASE}/${courseSlug}/lessons/${lessonSlug}/`);
}

export async function fetchMyEnrollments(): Promise<Enrollment[]> {
  return fetchWithAuth(`${API_BASE}/my-enrollments/`);
}

export async function checkEnrollment(slug: string): Promise<{ is_enrolled: boolean; course_slug: string }> {
  return fetchWithAuth(`${API_BASE}/${slug}/check-enrollment/`);
}

// ============ Progress Tracking API ============

export interface LessonProgressData {
  completed: boolean;
  video_position_seconds: number;
}

export interface CourseProgress {
  completed_lesson_ids: number[];
  total_lessons: number;
  completed_count: number;
  percentage: number;
  next_lesson_slug: string | null;
  lesson_progress: Record<number, LessonProgressData>;
}

export async function fetchCourseProgress(courseSlug: string): Promise<CourseProgress> {
  return fetchWithAuth(`${API_BASE}/${courseSlug}/progress/`);
}

export async function updateLessonProgress(
  courseSlug: string,
  lessonSlug: string,
  data: { completed?: boolean; video_position_seconds?: number }
): Promise<{ completed: boolean; video_position_seconds: number; completed_at: string | null }> {
  return fetchWithCsrf(`${API_BASE}/${courseSlug}/lessons/${lessonSlug}/progress/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ CMS API (Staff Only) ============

async function fetchWithCsrf(url: string, options: RequestInit = {}) {
  const csrfToken = getCSRFToken();
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken || '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Course CMS
export interface CourseWrite {
  title: string;
  slug?: string;
  description?: string;
  long_description?: string;
  thumbnail_url?: string;
  saleor_product_id?: string;
  status?: 'draft' | 'published';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  learning_objectives?: string[];
  tag_ids?: number[];
}

export interface CourseFull extends Course {
  status: 'draft' | 'published';
}

export async function fetchAllCourses(): Promise<CourseFull[]> {
  return fetchWithAuth(`${API_BASE}/cms/`);
}

export async function fetchCourseForEdit(slug: string): Promise<CourseFull> {
  return fetchWithAuth(`${API_BASE}/cms/${slug}/`);
}

export async function createCourse(data: CourseWrite): Promise<CourseFull> {
  return fetchWithCsrf(`${API_BASE}/cms/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourse(slug: string, data: Partial<CourseWrite>): Promise<CourseFull> {
  return fetchWithCsrf(`${API_BASE}/cms/${slug}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(slug: string): Promise<void> {
  await fetchWithCsrf(`${API_BASE}/cms/${slug}/`, {
    method: 'DELETE',
  });
}

// Module CMS
export interface ModuleWrite {
  title: string;
  description?: string;
  order?: number;
}

export async function createModule(courseSlug: string, data: ModuleWrite): Promise<Module> {
  return fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/modules/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateModule(courseSlug: string, moduleId: number, data: Partial<ModuleWrite>): Promise<Module> {
  return fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/modules/${moduleId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteModule(courseSlug: string, moduleId: number): Promise<void> {
  await fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/modules/${moduleId}/`, {
    method: 'DELETE',
  });
}

// Lesson CMS
export interface LessonWrite {
  title: string;
  slug?: string;
  blocks?: LessonBlock[];
  video_url?: string;
  bunny_video_id?: number | null;
  duration_minutes?: number;
  order?: number;
  is_free_preview?: boolean;
}

export async function createLesson(courseSlug: string, moduleId: number, data: LessonWrite): Promise<Lesson> {
  return fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/modules/${moduleId}/lessons/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchLessonForEdit(courseSlug: string, lessonSlug: string): Promise<Lesson> {
  return fetchWithAuth(`${API_BASE}/cms/${courseSlug}/lessons/${lessonSlug}/`);
}

export async function updateLesson(courseSlug: string, lessonSlug: string, data: Partial<LessonWrite>): Promise<Lesson> {
  return fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/lessons/${lessonSlug}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLesson(courseSlug: string, lessonSlug: string): Promise<void> {
  await fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/lessons/${lessonSlug}/`, {
    method: 'DELETE',
  });
}

// Reorder
export async function reorderModules(courseSlug: string, modules: { id: number; order: number }[]): Promise<void> {
  await fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/reorder-modules/`, {
    method: 'POST',
    body: JSON.stringify({ modules }),
  });
}

export async function reorderLessons(courseSlug: string, moduleId: number, lessons: { id: number; order: number }[]): Promise<void> {
  await fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/reorder-lessons/`, {
    method: 'POST',
    body: JSON.stringify({ module_id: moduleId, lessons }),
  });
}

// ============ Bunny Video API (Staff Only) ============

export interface BunnyUploadInit {
  video_id: number;
  guid: string;
  tus_upload_url: string;
  library_id: string;
  tus_headers: {
    AuthorizationSignature: string;
    AuthorizationExpire: string;
    VideoId: string;
    LibraryId: string;
  };
}

export interface BunnyVideoStatus {
  id: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  duration_seconds: number | null;
  thumbnail_url: string;
}

export async function fetchBunnyVideos(): Promise<BunnyVideo[]> {
  return fetchWithAuth(`${API_BASE}/videos/`);
}

export async function initBunnyUpload(title: string): Promise<BunnyUploadInit> {
  return fetchWithCsrf(`${API_BASE}/videos/upload/`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function confirmBunnyUpload(videoId: number): Promise<BunnyVideo> {
  return fetchWithCsrf(`${API_BASE}/videos/${videoId}/confirm/`, {
    method: 'POST',
  });
}

export async function checkBunnyVideoStatus(videoId: number): Promise<BunnyVideoStatus> {
  return fetchWithAuth(`${API_BASE}/videos/${videoId}/status/`);
}

export async function deleteBunnyVideo(videoId: number): Promise<void> {
  await fetchWithCsrf(`${API_BASE}/videos/${videoId}/`, {
    method: 'DELETE',
  });
}

// ============ Tags API ============

export async function fetchTags(): Promise<Tag[]> {
  return fetchWithAuth('/api/v1/blog/tags/');
}

// ============ Prerequisites API ============

export async function addPrerequisite(
  courseSlug: string,
  data: { required_course_id: number; enforcement: 'recommended' | 'required' }
): Promise<CoursePrerequisite> {
  return fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/prerequisites/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removePrerequisite(courseSlug: string, prerequisiteId: number): Promise<void> {
  await fetchWithCsrf(`${API_BASE}/cms/${courseSlug}/prerequisites/${prerequisiteId}/`, {
    method: 'DELETE',
  });
}

// ============ File Upload API ============

export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

export async function uploadCourseFile(file: File): Promise<UploadedFile> {
  const csrfToken = getCSRFToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/blog/upload-image/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRFToken': csrfToken || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Upload failed: ${response.status}`);
  }

  const result = await response.json();
  return {
    id: crypto.randomUUID(),
    url: result.url,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}
