export class ListLessonsService {
  constructor({ lessonRepository }) {
    this.lessonRepository = lessonRepository;
  }

  list({ language } = {}) {
    return this.lessonRepository.list({ language }).map((lesson) => ({
      lesson_id: lesson.id,
      topic: lesson.topic,
      difficulty: lesson.difficulty,
      estimated_minutes: lesson.estimated_minutes,
      language: lesson.language,
      version: lesson.version,
    }));
  }
}
