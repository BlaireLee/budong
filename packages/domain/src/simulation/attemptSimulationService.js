function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function masteryLabel(value) {
  if (value < 0.34) {
    return 'beginner';
  }

  if (value < 0.67) {
    return 'developing';
  }

  return 'proficient';
}

export class AttemptSimulationService {
  constructor({
    userRepository,
    lessonRepository,
    attemptRepository,
    masteryRepository,
    createId,
    clock = () => new Date(),
  }) {
    this.userRepository = userRepository;
    this.lessonRepository = lessonRepository;
    this.attemptRepository = attemptRepository;
    this.masteryRepository = masteryRepository;
    this.createId = createId;
    this.clock = clock;
  }

  attempt({ simulation_id, user_id, choices, rationale_text = '' }) {
    const user = this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('user not found');
    }

    const lesson = this.lessonRepository.findById(simulation_id);
    if (!lesson) {
      throw new Error('simulation not found');
    }

    const selectedIndex = Number(choices?.[0]);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= lesson.options.length) {
      throw new Error('choices[0] is invalid');
    }

    const isCorrect = selectedIndex === lesson.correct_option;
    const score = isCorrect ? 100 : 40;
    const feedback = lesson.feedback_by_option[selectedIndex];

    const previousMastery = this.masteryRepository.get(user_id, lesson.topic);
    const gain = isCorrect ? 0.2 : 0.05;
    const nextMastery = clamp(previousMastery + gain, 0, 1);
    this.masteryRepository.set(user_id, lesson.topic, nextMastery);

    const completedAt = this.clock().toISOString();
    this.attemptRepository.create({
      id: this.createId('attempt'),
      user_id,
      lesson_id: lesson.id,
      topic: lesson.topic,
      choices,
      rationale_text,
      score,
      feedback,
      completed_at: completedAt,
    });

    return {
      score,
      feedback,
      mastery_update: {
        topic: lesson.topic,
        previous_level: masteryLabel(previousMastery),
        new_level: masteryLabel(nextMastery),
        delta: Number((nextMastery - previousMastery).toFixed(2)),
        mastery_level: Number(nextMastery.toFixed(2)),
      },
    };
  }
}
