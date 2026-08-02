CREATE TABLE operation_log (
                               id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                               module        VARCHAR(100),
                               action        VARCHAR(50),
                               description   VARCHAR(255),
                               method_name   VARCHAR(255),
                               params        TEXT,
                               result        TEXT,
                               error_message TEXT,
                               operator_id   VARCHAR(50),
                               operator_name VARCHAR(100),
                               cost_millis   BIGINT,
                               success       BOOLEAN,
                               created_at    TIMESTAMP
);