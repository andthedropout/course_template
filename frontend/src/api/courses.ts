import { getCSRFToken } from '@/lib/getCookie';

const API_BASE = '/api/v1/courses';

export interface LessonBlock {
  id: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

export interface Lesson {
  id: number;
  title: string;
  slug: string;
  content?: string;
  blocks?: LessonBlock[];
  video_url?: string;
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

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail_url?: string;
  saleor_product_id?: string;
  total_lessons: number;
  total_duration_minutes: number;
  modules?: Module[];
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
  thumbnail_url?: string;
  saleor_product_id?: string;
  status?: 'draft' | 'published';
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
