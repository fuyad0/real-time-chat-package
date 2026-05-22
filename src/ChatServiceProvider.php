<?php

namespace Fuyad\Chat;

use Fuyad\Chat\Models\Conversation;
use Fuyad\Chat\Models\Message;
use Fuyad\Chat\Policies\ConversationPolicy;
use Fuyad\Chat\Policies\MessagePolicy;
use Illuminate\Support\Facades\Gate;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class ChatServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('fuyad-chat')
            ->hasConfigFile('chat');
    }

    public function boot(): void
    {
        parent::boot();

        // ✅ Load package migrations
        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');

        // ✅ Load routes
        $this->loadRoutesFrom(__DIR__ . '/Routes/api.php');

        $this->loadRoutesFrom(__DIR__ . '/Routes/web.php');

        // ✅ Load broadcast channel authorization
        $this->loadRoutesFrom(__DIR__ . '/Routes/channels.php');

        // Register custom logic
        $this->registerPolicies();

        $this->publishes([
            __DIR__ . '/Resources/Js/Chat-ui' =>
                resource_path('js/vendor/chat'),
        ], 'chat-ui');
    }

    protected function registerPolicies(): void
    {
        Gate::policy(Conversation::class, ConversationPolicy::class);
        Gate::policy(Message::class, MessagePolicy::class);
    }
}