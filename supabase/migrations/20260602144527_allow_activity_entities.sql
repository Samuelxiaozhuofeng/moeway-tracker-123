alter table public.immerselog_entities
  drop constraint if exists immerselog_entities_entity_type_check;

alter table public.immerselog_entities
  add constraint immerselog_entities_entity_type_check
  check (
    entity_type in ('activities', 'languages', 'goals', 'works', 'sessions', 'vocabulary', 'achievements', 'settings')
  );
