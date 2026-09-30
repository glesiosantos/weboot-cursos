-- Supabase Auth cannot deserialize NULL email-change strings when listing users.
-- Guest payment confirmation lists users before associating the student account.
-- Preserve pending email changes and tokens; normalize only missing values.
update auth.users
set email_change = coalesce(email_change, ''),
    email_change_token_new = coalesce(email_change_token_new, '')
where email_change is null or email_change_token_new is null;
