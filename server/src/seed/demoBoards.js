import prisma from '../prisma/client.js';

export async function seedDemoBoards(userId) {
  // Board 1: Product Launch
  const board1 = await prisma.board.create({
    data: {
      title: 'Product Launch Q2',
      color: '#0079bf',
      ownerId: userId,
    },
  });

  const b1Lists = await Promise.all([
    prisma.list.create({ data: { title: 'Backlog', position: 1, boardId: board1.id } }),
    prisma.list.create({ data: { title: 'To Do', position: 2, boardId: board1.id } }),
    prisma.list.create({ data: { title: 'In Progress', position: 3, boardId: board1.id } }),
    prisma.list.create({ data: { title: 'Review', position: 4, boardId: board1.id } }),
    prisma.list.create({ data: { title: 'Done', position: 5, boardId: board1.id } }),
  ]);

  const [backlog, todo, inProgress, review, done] = b1Lists;

  // Backlog cards
  const backlogCards = await Promise.all([
    prisma.card.create({ data: { title: 'Research competitor pricing models', position: 1, listId: backlog.id, description: 'Analyze top 5 competitors and their pricing tiers. Document feature comparisons and price points.' } }),
    prisma.card.create({ data: { title: 'Plan onboarding email sequence', position: 2, listId: backlog.id } }),
    prisma.card.create({ data: { title: 'Write blog post for launch announcement', position: 3, listId: backlog.id } }),
    prisma.card.create({ data: { title: 'Create demo video script', position: 4, listId: backlog.id } }),
    prisma.card.create({ data: { title: 'Set up analytics dashboard', position: 5, listId: backlog.id } }),
  ]);

  // To Do cards
  const todoCards = await Promise.all([
    prisma.card.create({ data: { title: 'Design landing page hero section', position: 1, listId: todo.id, description: 'Create a compelling hero section with clear value proposition, CTA button, and product screenshot.', dueDate: futureDate(5) } }),
    prisma.card.create({ data: { title: 'Implement Stripe payment integration', position: 2, listId: todo.id, dueDate: futureDate(7) } }),
    prisma.card.create({ data: { title: 'Build pricing page', position: 3, listId: todo.id, dueDate: futureDate(10) } }),
    prisma.card.create({ data: { title: 'Set up error monitoring (Sentry)', position: 4, listId: todo.id } }),
  ]);

  // In Progress cards
  const inProgressCards = await Promise.all([
    prisma.card.create({ data: { title: 'User authentication flow', position: 1, listId: inProgress.id, description: 'Implement sign up, login, password reset, and email verification. Using JWT with refresh tokens.', dueDate: futureDate(2) } }),
    prisma.card.create({ data: { title: 'Dashboard UI components', position: 2, listId: inProgress.id, description: 'Build the main dashboard with charts, stats cards, and recent activity feed.', dueDate: futureDate(3) } }),
    prisma.card.create({ data: { title: 'API rate limiting middleware', position: 3, listId: inProgress.id } }),
  ]);

  // Review cards
  const reviewCards = await Promise.all([
    prisma.card.create({ data: { title: 'Database schema optimization', position: 1, listId: review.id, description: 'Added indexes on frequently queried columns. Normalized the notifications table. Need review before merging.', dueDate: pastDate(1) } }),
    prisma.card.create({ data: { title: 'Mobile responsive navigation', position: 2, listId: review.id } }),
  ]);

  // Done cards
  const doneCards = await Promise.all([
    prisma.card.create({ data: { title: 'Project setup & CI/CD pipeline', position: 1, listId: done.id, description: 'Set up monorepo with Vite + Express. GitHub Actions for CI. Deployed staging to Railway.' } }),
    prisma.card.create({ data: { title: 'Design system & component library', position: 2, listId: done.id } }),
    prisma.card.create({ data: { title: 'User stories & wireframes', position: 3, listId: done.id } }),
  ]);

  // Labels for Board 1 cards
  await Promise.all([
    prisma.label.create({ data: { text: 'Design', color: '#61bd4f', cardId: todoCards[0].id } }),
    prisma.label.create({ data: { text: 'High Priority', color: '#eb5a46', cardId: todoCards[0].id } }),
    prisma.label.create({ data: { text: 'Backend', color: '#0079bf', cardId: todoCards[1].id } }),
    prisma.label.create({ data: { text: 'High Priority', color: '#eb5a46', cardId: todoCards[1].id } }),
    prisma.label.create({ data: { text: 'Frontend', color: '#c377e0', cardId: todoCards[2].id } }),
    prisma.label.create({ data: { text: 'Backend', color: '#0079bf', cardId: inProgressCards[0].id } }),
    prisma.label.create({ data: { text: 'Frontend', color: '#c377e0', cardId: inProgressCards[1].id } }),
    prisma.label.create({ data: { text: 'Design', color: '#61bd4f', cardId: inProgressCards[1].id } }),
    prisma.label.create({ data: { text: 'Backend', color: '#0079bf', cardId: inProgressCards[2].id } }),
    prisma.label.create({ data: { text: 'Backend', color: '#0079bf', cardId: reviewCards[0].id } }),
    prisma.label.create({ data: { text: 'Bug', color: '#eb5a46', cardId: reviewCards[0].id } }),
    prisma.label.create({ data: { text: 'Frontend', color: '#c377e0', cardId: reviewCards[1].id } }),
    prisma.label.create({ data: { text: 'DevOps', color: '#ff9f1a', cardId: doneCards[0].id } }),
    prisma.label.create({ data: { text: 'Design', color: '#61bd4f', cardId: doneCards[1].id } }),
    prisma.label.create({ data: { text: 'Research', color: '#f2d600', cardId: backlogCards[0].id } }),
    prisma.label.create({ data: { text: 'Marketing', color: '#ff9f1a', cardId: backlogCards[2].id } }),
    prisma.label.create({ data: { text: 'DevOps', color: '#ff9f1a', cardId: todoCards[3].id } }),
  ]);

  // Checklists for Board 1
  const cl1 = await prisma.checklist.create({ data: { title: 'Landing Page Tasks', cardId: todoCards[0].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Design hero mockup in Figma', checked: true, checklistId: cl1.id } }),
    prisma.checklistItem.create({ data: { text: 'Choose stock photos/illustrations', checked: true, checklistId: cl1.id } }),
    prisma.checklistItem.create({ data: { text: 'Write headline and subheadline copy', checked: false, checklistId: cl1.id } }),
    prisma.checklistItem.create({ data: { text: 'Build responsive HTML/CSS', checked: false, checklistId: cl1.id } }),
    prisma.checklistItem.create({ data: { text: 'Add animations and micro-interactions', checked: false, checklistId: cl1.id } }),
  ]);

  const cl2 = await prisma.checklist.create({ data: { title: 'Stripe Integration Steps', cardId: todoCards[1].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Create Stripe account & get API keys', checked: true, checklistId: cl2.id } }),
    prisma.checklistItem.create({ data: { text: 'Install Stripe SDK', checked: true, checklistId: cl2.id } }),
    prisma.checklistItem.create({ data: { text: 'Build checkout session endpoint', checked: false, checklistId: cl2.id } }),
    prisma.checklistItem.create({ data: { text: 'Handle webhook events', checked: false, checklistId: cl2.id } }),
    prisma.checklistItem.create({ data: { text: 'Test with Stripe CLI', checked: false, checklistId: cl2.id } }),
    prisma.checklistItem.create({ data: { text: 'Add subscription management UI', checked: false, checklistId: cl2.id } }),
  ]);

  const cl3 = await prisma.checklist.create({ data: { title: 'Auth Implementation', cardId: inProgressCards[0].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Registration endpoint with email validation', checked: true, checklistId: cl3.id } }),
    prisma.checklistItem.create({ data: { text: 'Login with JWT access + refresh tokens', checked: true, checklistId: cl3.id } }),
    prisma.checklistItem.create({ data: { text: 'Password reset flow', checked: true, checklistId: cl3.id } }),
    prisma.checklistItem.create({ data: { text: 'Email verification', checked: false, checklistId: cl3.id } }),
    prisma.checklistItem.create({ data: { text: 'OAuth (Google, GitHub)', checked: false, checklistId: cl3.id } }),
  ]);

  const cl4 = await prisma.checklist.create({ data: { title: 'Dashboard Components', cardId: inProgressCards[1].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Stats cards (users, revenue, growth)', checked: true, checklistId: cl4.id } }),
    prisma.checklistItem.create({ data: { text: 'Line chart for weekly activity', checked: true, checklistId: cl4.id } }),
    prisma.checklistItem.create({ data: { text: 'Recent activity feed', checked: false, checklistId: cl4.id } }),
    prisma.checklistItem.create({ data: { text: 'Quick actions sidebar', checked: false, checklistId: cl4.id } }),
  ]);

  const cl5 = await prisma.checklist.create({ data: { title: 'DB Review Checklist', cardId: reviewCards[0].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Run EXPLAIN on slow queries', checked: true, checklistId: cl5.id } }),
    prisma.checklistItem.create({ data: { text: 'Check index usage', checked: true, checklistId: cl5.id } }),
    prisma.checklistItem.create({ data: { text: 'Load test with production-like data', checked: false, checklistId: cl5.id } }),
  ]);

  // Board 2: Marketing Campaign
  const board2 = await prisma.board.create({
    data: {
      title: 'Marketing Campaign — Summer 2026',
      color: '#519839',
      ownerId: userId,
    },
  });

  const b2Lists = await Promise.all([
    prisma.list.create({ data: { title: 'Ideas', position: 1, boardId: board2.id } }),
    prisma.list.create({ data: { title: 'Planning', position: 2, boardId: board2.id } }),
    prisma.list.create({ data: { title: 'In Production', position: 3, boardId: board2.id } }),
    prisma.list.create({ data: { title: 'Scheduled', position: 4, boardId: board2.id } }),
    prisma.list.create({ data: { title: 'Published', position: 5, boardId: board2.id } }),
  ]);

  const [ideas, planning, production, scheduled, published] = b2Lists;

  // Ideas cards
  const ideaCards = await Promise.all([
    prisma.card.create({ data: { title: 'TikTok series: "Day in the life using our product"', position: 1, listId: ideas.id } }),
    prisma.card.create({ data: { title: 'Partner with tech YouTubers for reviews', position: 2, listId: ideas.id, description: 'Reach out to channels with 50k-200k subscribers. Budget: $5k per sponsorship.' } }),
    prisma.card.create({ data: { title: 'Launch referral program with rewards', position: 3, listId: ideas.id } }),
    prisma.card.create({ data: { title: 'Host a virtual launch event / webinar', position: 4, listId: ideas.id } }),
    prisma.card.create({ data: { title: 'Create comparison landing pages (us vs competitors)', position: 5, listId: ideas.id } }),
    prisma.card.create({ data: { title: 'Reddit AMA in r/SaaS', position: 6, listId: ideas.id } }),
  ]);

  // Planning cards
  const planCards = await Promise.all([
    prisma.card.create({ data: { title: 'Email drip campaign for free trial users', position: 1, listId: planning.id, description: 'Design a 7-email sequence:\n1. Welcome & quick start\n2. Feature highlight: dashboards\n3. Feature highlight: integrations\n4. Case study / social proof\n5. Tips & best practices\n6. Upgrade nudge\n7. Last chance / offer', dueDate: futureDate(4) } }),
    prisma.card.create({ data: { title: 'Social media content calendar — June', position: 2, listId: planning.id, dueDate: futureDate(8) } }),
    prisma.card.create({ data: { title: 'SEO keyword research & content plan', position: 3, listId: planning.id, description: 'Focus on long-tail keywords with low competition. Target 10 blog posts for the quarter.' } }),
    prisma.card.create({ data: { title: 'Design ad creatives for Facebook & Instagram', position: 4, listId: planning.id, dueDate: futureDate(6) } }),
  ]);

  // Production cards
  const prodCards = await Promise.all([
    prisma.card.create({ data: { title: 'Write "Getting Started" guide for docs', position: 1, listId: production.id, description: 'Comprehensive guide with screenshots. Cover account setup, first project, and key features.', dueDate: futureDate(1) } }),
    prisma.card.create({ data: { title: 'Record product walkthrough video', position: 2, listId: production.id, dueDate: futureDate(3) } }),
    prisma.card.create({ data: { title: 'Design customer testimonial graphics', position: 3, listId: production.id } }),
  ]);

  // Scheduled cards
  const schedCards = await Promise.all([
    prisma.card.create({ data: { title: 'Product Hunt launch', position: 1, listId: scheduled.id, description: 'Scheduled for June 15th. All assets ready. Hunter confirmed.', dueDate: futureDate(14) } }),
    prisma.card.create({ data: { title: 'Twitter/X thread: "Why we built this"', position: 2, listId: scheduled.id, dueDate: futureDate(2) } }),
    prisma.card.create({ data: { title: 'Newsletter blast to 12k subscribers', position: 3, listId: scheduled.id, dueDate: futureDate(3) } }),
  ]);

  // Published cards
  const pubCards = await Promise.all([
    prisma.card.create({ data: { title: 'Blog: "10 Productivity Hacks for Remote Teams"', position: 1, listId: published.id } }),
    prisma.card.create({ data: { title: 'Case study: How Acme Corp saved 20hrs/week', position: 2, listId: published.id } }),
    prisma.card.create({ data: { title: 'LinkedIn carousel: Product features overview', position: 3, listId: published.id } }),
    prisma.card.create({ data: { title: 'Press release sent to 50 outlets', position: 4, listId: published.id } }),
  ]);

  // Labels for Board 2
  await Promise.all([
    prisma.label.create({ data: { text: 'Social', color: '#c377e0', cardId: ideaCards[0].id } }),
    prisma.label.create({ data: { text: 'Video', color: '#ff9f1a', cardId: ideaCards[1].id } }),
    prisma.label.create({ data: { text: 'Growth', color: '#61bd4f', cardId: ideaCards[2].id } }),
    prisma.label.create({ data: { text: 'Event', color: '#0079bf', cardId: ideaCards[3].id } }),
    prisma.label.create({ data: { text: 'SEO', color: '#f2d600', cardId: ideaCards[4].id } }),
    prisma.label.create({ data: { text: 'Community', color: '#c377e0', cardId: ideaCards[5].id } }),
    prisma.label.create({ data: { text: 'Email', color: '#0079bf', cardId: planCards[0].id } }),
    prisma.label.create({ data: { text: 'High Priority', color: '#eb5a46', cardId: planCards[0].id } }),
    prisma.label.create({ data: { text: 'Social', color: '#c377e0', cardId: planCards[1].id } }),
    prisma.label.create({ data: { text: 'SEO', color: '#f2d600', cardId: planCards[2].id } }),
    prisma.label.create({ data: { text: 'Ads', color: '#eb5a46', cardId: planCards[3].id } }),
    prisma.label.create({ data: { text: 'Design', color: '#61bd4f', cardId: planCards[3].id } }),
    prisma.label.create({ data: { text: 'Content', color: '#f2d600', cardId: prodCards[0].id } }),
    prisma.label.create({ data: { text: 'Video', color: '#ff9f1a', cardId: prodCards[1].id } }),
    prisma.label.create({ data: { text: 'Design', color: '#61bd4f', cardId: prodCards[2].id } }),
    prisma.label.create({ data: { text: 'Launch', color: '#eb5a46', cardId: schedCards[0].id } }),
    prisma.label.create({ data: { text: 'High Priority', color: '#eb5a46', cardId: schedCards[0].id } }),
    prisma.label.create({ data: { text: 'Social', color: '#c377e0', cardId: schedCards[1].id } }),
    prisma.label.create({ data: { text: 'Email', color: '#0079bf', cardId: schedCards[2].id } }),
    prisma.label.create({ data: { text: 'Content', color: '#f2d600', cardId: pubCards[0].id } }),
    prisma.label.create({ data: { text: 'Content', color: '#f2d600', cardId: pubCards[1].id } }),
    prisma.label.create({ data: { text: 'Social', color: '#c377e0', cardId: pubCards[2].id } }),
    prisma.label.create({ data: { text: 'PR', color: '#0079bf', cardId: pubCards[3].id } }),
  ]);

  // Checklists for Board 2
  const cl6 = await prisma.checklist.create({ data: { title: 'Email Sequence', cardId: planCards[0].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Write email 1: Welcome & quick start', checked: true, checklistId: cl6.id } }),
    prisma.checklistItem.create({ data: { text: 'Write email 2: Feature highlight — dashboards', checked: true, checklistId: cl6.id } }),
    prisma.checklistItem.create({ data: { text: 'Write email 3: Feature highlight — integrations', checked: true, checklistId: cl6.id } }),
    prisma.checklistItem.create({ data: { text: 'Write email 4: Case study / social proof', checked: false, checklistId: cl6.id } }),
    prisma.checklistItem.create({ data: { text: 'Write email 5: Tips & best practices', checked: false, checklistId: cl6.id } }),
    prisma.checklistItem.create({ data: { text: 'Write email 6: Upgrade nudge', checked: false, checklistId: cl6.id } }),
    prisma.checklistItem.create({ data: { text: 'Write email 7: Last chance offer', checked: false, checklistId: cl6.id } }),
    prisma.checklistItem.create({ data: { text: 'Set up in Mailchimp/Sendgrid', checked: false, checklistId: cl6.id } }),
    prisma.checklistItem.create({ data: { text: 'A/B test subject lines', checked: false, checklistId: cl6.id } }),
  ]);

  const cl7 = await prisma.checklist.create({ data: { title: 'Content Calendar Tasks', cardId: planCards[1].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Brainstorm 20 post ideas', checked: true, checklistId: cl7.id } }),
    prisma.checklistItem.create({ data: { text: 'Create posting schedule (3x/week)', checked: true, checklistId: cl7.id } }),
    prisma.checklistItem.create({ data: { text: 'Design templates in Canva', checked: false, checklistId: cl7.id } }),
    prisma.checklistItem.create({ data: { text: 'Write captions for week 1', checked: false, checklistId: cl7.id } }),
    prisma.checklistItem.create({ data: { text: 'Schedule in Buffer/Hootsuite', checked: false, checklistId: cl7.id } }),
  ]);

  const cl8 = await prisma.checklist.create({ data: { title: 'Getting Started Guide', cardId: prodCards[0].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Write account setup section', checked: true, checklistId: cl8.id } }),
    prisma.checklistItem.create({ data: { text: 'Write first project walkthrough', checked: true, checklistId: cl8.id } }),
    prisma.checklistItem.create({ data: { text: 'Take annotated screenshots', checked: true, checklistId: cl8.id } }),
    prisma.checklistItem.create({ data: { text: 'Add troubleshooting FAQ', checked: false, checklistId: cl8.id } }),
    prisma.checklistItem.create({ data: { text: 'Get technical review', checked: false, checklistId: cl8.id } }),
    prisma.checklistItem.create({ data: { text: 'Publish to docs site', checked: false, checklistId: cl8.id } }),
  ]);

  const cl9 = await prisma.checklist.create({ data: { title: 'Product Hunt Prep', cardId: schedCards[0].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Create maker profile', checked: true, checklistId: cl9.id } }),
    prisma.checklistItem.create({ data: { text: 'Prepare tagline and description', checked: true, checklistId: cl9.id } }),
    prisma.checklistItem.create({ data: { text: 'Design gallery images (5)', checked: true, checklistId: cl9.id } }),
    prisma.checklistItem.create({ data: { text: 'Record demo GIF', checked: true, checklistId: cl9.id } }),
    prisma.checklistItem.create({ data: { text: 'Line up hunter', checked: true, checklistId: cl9.id } }),
    prisma.checklistItem.create({ data: { text: 'Prepare first comment', checked: false, checklistId: cl9.id } }),
    prisma.checklistItem.create({ data: { text: 'Notify community to upvote', checked: false, checklistId: cl9.id } }),
  ]);

  const cl10 = await prisma.checklist.create({ data: { title: 'Video Production', cardId: prodCards[1].id } });
  await Promise.all([
    prisma.checklistItem.create({ data: { text: 'Write script / outline', checked: true, checklistId: cl10.id } }),
    prisma.checklistItem.create({ data: { text: 'Record screen capture', checked: false, checklistId: cl10.id } }),
    prisma.checklistItem.create({ data: { text: 'Record voiceover', checked: false, checklistId: cl10.id } }),
    prisma.checklistItem.create({ data: { text: 'Edit and add captions', checked: false, checklistId: cl10.id } }),
    prisma.checklistItem.create({ data: { text: 'Upload to YouTube + embed on site', checked: false, checklistId: cl10.id } }),
  ]);
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function pastDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
