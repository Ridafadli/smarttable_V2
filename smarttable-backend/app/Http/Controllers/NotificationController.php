<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->notifications()->latest();

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        $perPage = min((int) $request->get('per_page', 30), 50);
        $paginated = $query->paginate($perPage);
        $paginated->getCollection()->transform(fn (Notification $n) => $this->format($n));

        return response()->json($paginated);
    }

    public function unreadCount(Request $request)
    {
        $count = $request->user()->notifications()->whereNull('read_at')->count();

        return response()->json(['count' => $count]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        $this->authorizeNotification($request, $notification);

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json($this->format($notification->fresh()));
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Toutes les notifications ont été lues']);
    }

    public function destroy(Request $request, Notification $notification)
    {
        $this->authorizeNotification($request, $notification);
        $notification->delete();

        return response()->json(['message' => 'Notification supprimée']);
    }

    private function authorizeNotification(Request $request, Notification $notification): void
    {
        if ((int) $notification->restaurant_id !== (int) $request->user()->id) {
            abort(403, 'Non autorisé');
        }
    }

    private function format(Notification $notification): array
    {
        return [
            'id'         => $notification->id,
            'type'       => $notification->type,
            'title'      => $notification->title,
            'message'    => $notification->message,
            'data'       => $notification->data,
            'read_at'    => $notification->read_at?->toIso8601String(),
            'is_unread'  => $notification->isUnread(),
            'created_at' => $notification->created_at?->toIso8601String(),
        ];
    }
}
