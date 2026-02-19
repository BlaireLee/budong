export class GetLessonDetailService {
  constructor({ lessonRepository }) {
    this.lessonRepository = lessonRepository;
  }

  get(lessonId) {
    const lesson = this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('lesson not found');
    }

    return {
      lesson_id: lesson.id,
      topic: lesson.topic,
      difficulty: lesson.difficulty,
      estimated_minutes: lesson.estimated_minutes,
      language: lesson.language,
      version: lesson.version,
      scenario: lesson.scenario,
      options: lesson.options,
    };
  }
}
