# Purpose
This application is a social platform for tracking and sharing progress in personal passions and creative pursuits. Unlike fitness or productivity trackers, it emphasizes meaningful, project-based activities such as woodworking, reading, and writing. The app enables users to capture updates, share evidence of progress, and connect with others who share similar interests.

Core Value
	• Connection: Maintain lightweight, ongoing visibility into friends’ creative lives.
	• Expression: Provide a simple way to log progress with photos, notes, or excerpts.
	• Discovery: Surface others who pursue the same passions, organized by project stage or locality.
	• Encouragement: Offer kudos, comments, and low-friction prompts to keep projects alive.

Key Features (MVP)
	• User profiles with passions and active projects.
	• Project creation and status tracking (exploring, active, paused, finished).
	• Entry logging with text, media, links, and tags.
	• Feed of friends’ and shared-passion entries.
	• Reactions (kudos, comments) and visibility controls (private, friends, public).
	• Basic discovery by passion and connections.
	• PostHog analytics instrumentation to track usage and growth.


# Core Objects
- User
- Passion: categories (and subcategories), like woodworking, reading, writing (novel, poetry, song), cooking, learning a language etc.. Also ability for custom passions. 
- Project: named container under a passion. Different stages or chapters, and setbacks. 
- Entry: an instance of someone working on a passion or project
- Reactions: kudos, comments
- Connection: friends or follows

# Features
- Privacy: ability to set profile to private, friends, or public to decide discoverability. 

# Getting Started
- Set up a profile. Name, location, passions (choose 3-5, with the ability to add more)
- add your current projects, their status, and their stage

# Tech
- Frontend/backend: Next.js 14 with TypeScript
UI: Tailwind CSS + shadcn/ui
Analytics: PostHog