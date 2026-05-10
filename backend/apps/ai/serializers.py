from rest_framework import serializers


class ChatHistoryMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=("user", "assistant"))
    content = serializers.CharField(allow_blank=False, max_length=3000, trim_whitespace=True)


class ChatRequestSerializer(serializers.Serializer):
    question = serializers.CharField(allow_blank=False, max_length=2000, trim_whitespace=True)
    selectedText = serializers.CharField(
        allow_blank=True,
        max_length=5000,
        required=False,
        trim_whitespace=True,
    )
    history = ChatHistoryMessageSerializer(many=True, required=False)

    def validate_history(self, value):
        if len(value) > 10:
            raise serializers.ValidationError("History can contain at most 10 messages.")

        return value
