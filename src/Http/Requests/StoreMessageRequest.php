<?php

namespace Fuyad\Chat\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
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
            'message' => 'nullable|string|min:1|max:10000',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|max:' . (config('chat.max_attachment_size') * 1024),
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'message.required' => 'Message body is required',
            'message.max' => 'Message is too long (max 10000 characters)',
            'attachments.max' => 'Maximum 10 attachments per message',
            'attachments.*.max' => 'Attachment is too large',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (!$this->message && !$this->hasFile('attachments')) {
                $validator->errors()->add(
                    'message',
                    'Either message or attachment is required'
                );
            }
        });
    }
}
