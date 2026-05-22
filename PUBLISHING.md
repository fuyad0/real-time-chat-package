# Publishing `fuyad/chat`

## Pre-publish checklist

- [ ] All PHP changes are under `src/`, `config/`, and `database` migrations
- [ ] Frontend source of truth: `src/Resources/Js/Chat-ui/` (synced with host `resources/js/vendor/chat` after changes)
- [ ] Run `composer validate --strict` inside this directory (no `composer.lock` in this package — that is intentional for libraries)
- [ ] Tag a release: `git tag v1.0.0`

## Sync host app UI into the package

From the test app root:

```bash
# Windows PowerShell
Copy-Item -Recurse -Force resources/js/vendor/chat/* package/fuyad/chat/src/Resources/Js/Chat-ui/
```

Or publish from package to the app:

```bash
php artisan vendor:publish --tag=chat-ui --force
```

## Publish to Packagist

1. Push this package to its own Git repository (or monorepo subtree).
2. Create a release tag (e.g. `v1.0.0`).
3. Submit the repository URL on [packagist.org](https://packagist.org/).
4. Consumers install with:

```bash
composer require fuyad/chat
```

## Host application requirements

- Laravel 11+ with `laravel/reverb` and broadcasting configured
- `@laravel/echo-react`, `laravel-echo`, `pusher-js` on the frontend
- UI dialog component at `@/components/ui/dialog` (used by `MembersDialog`)
- Run migrations and publish config + chat UI assets

```bash
php artisan vendor:publish --provider="Fuyad\Chat\ChatServiceProvider" --tag="chat-config"
php artisan vendor:publish --tag=chat-ui
php artisan migrate
```

## Real-time events

| Event | Channel | Listen (Echo) |
|-------|---------|---------------|
| `message:received` | `private-conversation.{id}` | `.message:received` |
| `message:delivered` | `private-conversation.{id}` | `.message:delivered` |
| `message:read` | `private-conversation.{id}` | `.message:read` |
| `user:typing` | `private-conversation.{id}` | `.user:typing` |
| `user:online` / `user:offline` | `private-chat.presence` | `.user:online` / `.user:offline` |
