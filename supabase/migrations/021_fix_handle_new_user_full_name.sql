-- Pull full_name from auth user metadata when creating the profile row.
-- Web signups pass full_name via options.data; this ensures it lands on the profile
-- immediately at row creation, before email confirmation completes.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;
