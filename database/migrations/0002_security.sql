CREATE TABLE IF NOT EXISTS login_rate_limits (
 bucket CHAR(64) PRIMARY KEY,
 attempts INT UNSIGNED NOT NULL,
 window_start DATETIME NOT NULL,
 INDEX idx_login_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS audit_logs (
 id CHAR(36) PRIMARY KEY,
 actor_id CHAR(36) NULL,
 action VARCHAR(80) NOT NULL,
 target_id CHAR(36) NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX idx_audit_created (created_at),
 INDEX idx_audit_actor (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
