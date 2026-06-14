# Chatbot Notes

Captured issues to revisit later:

- The bot can sound confident without verifying facts.
- Personal details such as hobbies should only be confirmed if they exist in verified resume or profile data.
- User-provided claims should not be echoed back as facts unless the bot can confirm them from source data.
- The assistant should answer directly when asked for constructive critique, but keep the answer grounded in evidence.
- The prompt needs a stronger rule to separate verified facts, inferred statements, and unknowns.

Planned follow-up work:

- Add source-grounded retrieval for resume and project data.
- Add a stricter response policy for personal-life questions.
- Add a fallback like "I can't confirm that from the available information" when the data is missing.
