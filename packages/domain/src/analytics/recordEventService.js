export class RecordEventService {
  constructor({ eventRepository, createId, clock = () => new Date() }) {
    this.eventRepository = eventRepository;
    this.createId = createId;
    this.clock = clock;
  }

  record({ event_name, user_id, session_id, props = {} }) {
    if (typeof event_name !== 'string' || event_name.trim().length === 0) {
      throw new Error('event_name is required');
    }

    if (typeof user_id !== 'string' || user_id.trim().length === 0) {
      throw new Error('user_id is required');
    }

    if (typeof session_id !== 'string' || session_id.trim().length === 0) {
      throw new Error('session_id is required');
    }

    const event = {
      id: this.createId('evt'),
      event_name,
      user_id,
      session_id,
      props,
      created_at: this.clock().toISOString(),
    };

    this.eventRepository.create(event);

    return {
      accepted: true,
      event_id: event.id,
    };
  }
}
