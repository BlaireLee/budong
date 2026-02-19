import { GuardianConsentService } from './consent/guardianConsentService.js';
import { InMemoryConsentRepository } from './consent/consentRepository.js';
import { GetLessonDetailService } from './curriculum/getLessonDetailService.js';
import { ListLessonsService } from './curriculum/listLessonsService.js';
import { InMemoryLessonRepository } from './curriculum/lessonRepository.js';
import { SignupService } from './identity/signupService.js';
import { InMemoryUserRepository } from './identity/userRepository.js';
import { createId } from './infra/createId.js';
import { AdPolicyEngine } from './monetization/adPolicyEngine.js';
import { AttemptSimulationService } from './simulation/attemptSimulationService.js';
import { InMemoryAttemptRepository } from './simulation/attemptRepository.js';
import { InMemoryMasteryRepository } from './simulation/masteryRepository.js';
import { InMemoryEventRepository } from './analytics/eventRepository.js';
import { RecordEventService } from './analytics/recordEventService.js';
import { KpiService } from './analytics/kpiService.js';

export function createDomainContext(options = {}) {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.createId ?? createId;

  const userRepository = options.userRepository ?? new InMemoryUserRepository();
  const consentRepository = options.consentRepository ?? new InMemoryConsentRepository();
  const lessonRepository = options.lessonRepository ?? new InMemoryLessonRepository();
  const attemptRepository = options.attemptRepository ?? new InMemoryAttemptRepository();
  const masteryRepository = options.masteryRepository ?? new InMemoryMasteryRepository();
  const eventRepository = options.eventRepository ?? new InMemoryEventRepository();

  const signupService = new SignupService({
    userRepository,
    consentRepository,
    createId: idFactory,
    clock,
  });

  const guardianConsentService = new GuardianConsentService({
    userRepository,
    consentRepository,
    clock,
  });

  const listLessonsService = new ListLessonsService({ lessonRepository });
  const getLessonDetailService = new GetLessonDetailService({ lessonRepository });

  const attemptSimulationService = new AttemptSimulationService({
    userRepository,
    lessonRepository,
    attemptRepository,
    masteryRepository,
    createId: idFactory,
    clock,
  });

  const recordEventService = new RecordEventService({
    eventRepository,
    createId: idFactory,
    clock,
  });

  const adPolicyEngine = new AdPolicyEngine({
    userRepository,
    consentRepository,
    config: options.adPolicyConfig,
  });

  const kpiService = new KpiService({
    userRepository,
    attemptRepository,
    eventRepository,
    clock,
  });

  return {
    repositories: {
      userRepository,
      consentRepository,
      lessonRepository,
      attemptRepository,
      masteryRepository,
      eventRepository,
    },
    services: {
      signupService,
      guardianConsentService,
      listLessonsService,
      getLessonDetailService,
      attemptSimulationService,
      recordEventService,
      adPolicyEngine,
      kpiService,
    },
  };
}
