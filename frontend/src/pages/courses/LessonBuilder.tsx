import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { fetchLessonForEdit, updateLesson, LessonWrite } from '@/api/courses';
import { LessonEditor, Lesson, LessonBlock } from '@/components/courses/editor';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

export default function LessonBuilder() {
  const { slug, lessonSlug } = useParams({ from: '/courses/$slug/$lessonSlug' });
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLesson();
  }, [slug, lessonSlug]);

  async function loadLesson() {
    try {
      setIsLoading(true);
      const data = await fetchLessonForEdit(slug, lessonSlug);
      // Transform API response to editor format
      const editorLesson: Lesson = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        blocks: (data.blocks || []) as LessonBlock[],
        video_url: data.video_url || '',
        duration_minutes: data.duration_minutes,
        order: data.order,
        is_free_preview: data.is_free_preview,
      };
      setLesson(editorLesson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(updates: Partial<Lesson>) {
    // Transform to API format
    const apiUpdates: Partial<LessonWrite> = {
      title: updates.title,
      slug: updates.slug,
      blocks: updates.blocks as LessonWrite['blocks'],
      video_url: updates.video_url,
      duration_minutes: updates.duration_minutes,
      is_free_preview: updates.is_free_preview,
    };
    const updated = await updateLesson(slug, lessonSlug, apiUpdates);
    // Transform response back to editor format
    const editorLesson: Lesson = {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      blocks: (updated.blocks || []) as LessonBlock[],
      video_url: updated.video_url || '',
      duration_minutes: updated.duration_minutes,
      order: updated.order,
      is_free_preview: updated.is_free_preview,
    };
    setLesson(editorLesson);
    // If slug changed, update URL
    if (updated.slug !== lessonSlug) {
      navigate({
        to: '/courses/$slug/$lessonSlug',
        params: { slug, lessonSlug: updated.slug },
        replace: true,
      });
    }
  }

  function handleBack() {
    navigate({ to: '/courses/$slug/', params: { slug } });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="AlertCircle" className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="mb-2">Error</CardTitle>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={handleBack}>Back to Course</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <LessonEditor
        lesson={lesson}
        courseSlug={slug}
        onSave={handleSave}
        onBack={handleBack}
      />
    </div>
  );
}
