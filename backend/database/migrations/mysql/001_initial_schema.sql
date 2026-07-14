CREATE DATABASE IF NOT EXISTS social_analytics;
USE social_analytics;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email_verified_at DATETIME NULL,
  mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  mfa_secret VARBINARY(255) NULL,
  status ENUM('active', 'suspended', 'invited') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teams (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_teams_owner(owner_user_id),
  CONSTRAINT fk_teams_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('admin', 'manager', 'analyst') NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_team_user(team_id, user_id),
  INDEX idx_tm_user(user_id),
  CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS social_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'youtube') NOT NULL,
  account_external_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(100) NOT NULL,
  access_token VARBINARY(2048) NOT NULL,
  refresh_token VARBINARY(2048) NULL,
  token_expires_at DATETIME NULL,
  scopes JSON NULL,
  status ENUM('active', 'expired', 'revoked') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_platform_account(platform, account_external_id),
  INDEX idx_sa_team(team_id),
  INDEX idx_sa_status(status),
  CONSTRAINT fk_sa_team FOREIGN KEY (team_id) REFERENCES teams(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  social_account_id BIGINT UNSIGNED NOT NULL,
  external_post_id VARCHAR(255) NOT NULL,
  content_text TEXT NULL,
  content_media JSON NULL,
  posted_at DATETIME NOT NULL,
  reach BIGINT UNSIGNED NULL,
  impressions BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_post_account_external(social_account_id, external_post_id),
  INDEX idx_posts_posted_at(posted_at),
  CONSTRAINT fk_posts_account FOREIGN KEY (social_account_id) REFERENCES social_accounts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS post_metrics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  metric_date DATE NOT NULL,
  likes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  comments BIGINT UNSIGNED NOT NULL DEFAULT 0,
  shares BIGINT UNSIGNED NOT NULL DEFAULT 0,
  saves BIGINT UNSIGNED NOT NULL DEFAULT 0,
  clicks BIGINT UNSIGNED NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(8,4) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_post_metric_day(post_id, metric_date),
  INDEX idx_pm_metric_date(metric_date),
  CONSTRAINT fk_pm_post FOREIGN KEY (post_id) REFERENCES posts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS account_daily_metrics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  social_account_id BIGINT UNSIGNED NOT NULL,
  metric_date DATE NOT NULL,
  followers BIGINT UNSIGNED NULL,
  subscribers BIGINT UNSIGNED NULL,
  reach BIGINT UNSIGNED NULL,
  impressions BIGINT UNSIGNED NULL,
  profile_visits BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_account_day(social_account_id, metric_date),
  INDEX idx_adm_metric_date(metric_date),
  CONSTRAINT fk_adm_account FOREIGN KEY (social_account_id) REFERENCES social_accounts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS content_drafts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  media JSON NULL,
  tags JSON NULL,
  status ENUM('draft', 'approved', 'archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_drafts_team(team_id),
  CONSTRAINT fk_drafts_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT fk_drafts_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  draft_id BIGINT UNSIGNED NOT NULL,
  scheduled_by BIGINT UNSIGNED NOT NULL,
  scheduled_for DATETIME NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  target_accounts JSON NOT NULL,
  status ENUM('queued', 'processing', 'published', 'failed', 'cancelled') NOT NULL DEFAULT 'queued',
  error_message TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_sp_scheduled_for(scheduled_for),
  INDEX idx_sp_status(status),
  CONSTRAINT fk_sp_draft FOREIGN KEY (draft_id) REFERENCES content_drafts(id),
  CONSTRAINT fk_sp_user FOREIGN KEY (scheduled_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS competitor_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'youtube') NOT NULL,
  account_external_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_competitor(team_id, platform, account_external_id),
  CONSTRAINT fk_comp_team FOREIGN KEY (team_id) REFERENCES teams(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hashtag_metrics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  hashtag VARCHAR(120) NOT NULL,
  metric_date DATE NOT NULL,
  mentions BIGINT UNSIGNED NOT NULL DEFAULT 0,
  engagement BIGINT UNSIGNED NOT NULL DEFAULT 0,
  reach BIGINT UNSIGNED NULL,
  trend_score DECIMAL(10,4) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_hashtag_date(hashtag, metric_date),
  CONSTRAINT fk_hashtag_team FOREIGN KEY (team_id) REFERENCES teams(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  rule_json JSON NOT NULL,
  channel_json JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_alerts_team(team_id),
  CONSTRAINT fk_alerts_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT fk_alerts_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_notif_team(team_id),
  INDEX idx_notif_user(user_id),
  CONSTRAINT fk_notif_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  generated_by BIGINT UNSIGNED NULL,
  report_type ENUM('weekly', 'monthly', 'custom') NOT NULL,
  output_format ENUM('pdf', 'csv', 'xlsx') NOT NULL,
  filters_json JSON NULL,
  file_url VARCHAR(500) NULL,
  generated_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_reports_team(team_id),
  CONSTRAINT fk_reports_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT fk_reports_user FOREIGN KEY (generated_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS webhooks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_url VARCHAR(500) NOT NULL,
  secret VARBINARY(255) NOT NULL,
  events JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_webhooks_team FOREIGN KEY (team_id) REFERENCES teams(id)
) ENGINE=InnoDB;
