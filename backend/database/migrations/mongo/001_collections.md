# MongoDB Collections Plan

Database: social_analytics_docs

## Collection: post_raw_payloads
- Purpose: Store raw API payloads from each platform for audit/reprocessing
- Suggested fields:
  - source_platform
  - social_account_id
  - external_post_id
  - fetched_at
  - payload
- Indexes:
  - { source_platform: 1, external_post_id: 1 }
  - { social_account_id: 1, fetched_at: -1 }

## Collection: comment_stream
- Purpose: Large-volume comments and mentions for sentiment analysis
- Suggested fields:
  - source_platform
  - social_account_id
  - external_comment_id
  - language
  - sentiment_label
  - sentiment_score
  - text
  - created_at
- Indexes:
  - { social_account_id: 1, created_at: -1 }
  - { sentiment_label: 1, created_at: -1 }

## Collection: demographic_snapshots
- Purpose: Denormalized audience demographic snapshots by date range
- Suggested fields:
  - team_id
  - social_account_id
  - period_start
  - period_end
  - audience_breakdown
- Indexes:
  - { social_account_id: 1, period_end: -1 }

## Collection: ml_predictions
- Purpose: Predictive analytics outputs (growth, engagement forecasts)
- Suggested fields:
  - model_name
  - version
  - entity_type
  - entity_id
  - prediction_window
  - input_features
  - output
  - created_at
- Indexes:
  - { entity_type: 1, entity_id: 1, created_at: -1 }
