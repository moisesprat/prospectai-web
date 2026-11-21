## ADDED Requirements

### Requirement: Old pattern URLs redirect to their new location
Every URL previously under `/patterns/*` SHALL 301-redirect to its corresponding new URL under `/architecture/patterns/*`, so existing inbound links and search-indexed URLs continue to resolve.

#### Scenario: Hub redirects
- **WHEN** `/patterns/` is requested
- **THEN** the response is a 301 redirect to `/architecture/patterns/`

#### Scenario: adversarial-critic redirects
- **WHEN** `/patterns/adversarial-critic` is requested
- **THEN** the response is a 301 redirect to `/architecture/patterns/adversarial-critic`

#### Scenario: parallel-execution redirects
- **WHEN** `/patterns/parallel-execution` is requested
- **THEN** the response is a 301 redirect to `/architecture/patterns/parallel-execution`

#### Scenario: output-validation redirects
- **WHEN** `/patterns/output-validation` is requested
- **THEN** the response is a 301 redirect to `/architecture/patterns/output-validation`

#### Scenario: model-tiering redirects
- **WHEN** `/patterns/model-tiering` is requested
- **THEN** the response is a 301 redirect to `/architecture/patterns/model-tiering`
