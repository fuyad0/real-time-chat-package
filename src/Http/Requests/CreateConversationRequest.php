<?php

namespace Fuyad\Chat\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateConversationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'type' => 'required|in:direct,group',
            'name' => 'required_if:type,group|nullable|string|max:255',
            'avatar_path' => 'nullable|string|url',
            'member_ids' => 'required|array|min:1',
            'member_ids.*' => 'integer|exists:users,id',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'type.required' => 'Conversation type is required',
            'type.in' => 'Conversation type must be direct or group',
            'name.required_if' => 'Name is required for group conversations',
            'member_ids.required' => 'At least one member is required',
            'member_ids.*.exists' => 'One or more members do not exist',
        ];
    }
}
