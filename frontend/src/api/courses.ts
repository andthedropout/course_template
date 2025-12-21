const API_BASE = '/api/v1/courses';

export interface Lesson {
  id: number;
  title: string;
  slug: string;
  content?: string;
  video_url?: string;
  duration_minutes: number;
  order: number;
  is_free_preview: boolean;
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
