-- Seed data for Event Registration System
-- Default Admin: admin@event.com / admin123
-- Default User: user@event.com / user123

-- Passwords are bcrypt hashes of 'admin123' and 'user123'
-- Hash of 'admin123': $2a$10$jFXkIuzUiZRcMVmP.QhxTO.1kDErkQNpI.ZXv.M3xVyVEfwwafGEO
-- Hash of 'user123':  $2a$10$/IVBEE0To0WxuXtgIcTiHuzIOxvH5rUheywozKWvrinPkDG7pzvXe

INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@event.com', '$2a$10$jFXkIuzUiZRcMVmP.QhxTO.1kDErkQNpI.ZXv.M3xVyVEfwwafGEO', 'admin'),
('user', 'user@event.com', '$2a$10$/IVBEE0To0WxuXtgIcTiHuzIOxvH5rUheywozKWvrinPkDG7pzvXe', 'user');

INSERT INTO events (title, description, category, date, time, location, capacity, spots_left, image_url) VALUES
('Tech Conference 2026', 'A gathering of developers, designers, and tech enthusiasts to discuss the latest in AI, Cloud, and Web technologies.', 'Technology', '2026-09-15', '09:00:00', 'KTPO Convention Centre, Whitefield, Bengaluru', 100, 100, '/images/tech_conf.png'),
('Summer Music Festival', 'An open-air music festival featuring top bands, food trucks, and art installations. Fun for all ages!', 'Music', '2026-08-25', '16:00:00', 'Palace Grounds, Jayamahal Road, Bengaluru', 150, 150, '/images/music_fest.png'),
('Global Food Expo', 'Taste dishes from over 50 countries, attend cooking masterclasses by world-renowned chefs, and discover food trends.', 'Food & Drink', '2026-10-05', '10:00:00', 'BIEC (Bangalore International Exhibition Centre)', 200, 200, '/images/food_expo.png'),
('Startup Pitch Night', 'Watch early-stage startups pitch their business ideas to a panel of top venture capitalists and angel investors.', 'Business', '2026-09-20', '18:30:00', 'WeWork Galaxy, Residency Road, Bengaluru', 50, 50, '/images/startup_pitch.png'),
('Charity Fun Run', 'Join our 5K charity run to raise funds for local community development projects. Free T-shirt for all participants.', 'Sports', '2026-10-12', '07:30:00', 'Cubbon Park (Kanteerava Stadium entrance), Bengaluru', 300, 300, '/images/charity_run.png'),
('AI & Robotics Summit', 'Discover the future of robotics, automation, and deep learning algorithms at the premier Artificial Intelligence summit of 2026.', 'Technology', '2026-10-22', '13:00:00', 'NIMHANS Convention Centre, Lakkasandra, Bengaluru', 120, 120, '/images/ai_summit.png');
