import {
  Box, Button, Code, Divider, Mark, Paper, Stack, Text, TextInput, Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { CreateCompletionRequest, CreateCompletionResponse } from 'openai';
import React from 'react';

interface FormValues {
  movie: string;
}

// Borrowed from gpt3 examples https://beta.openai.com/examples/default-movie-to-emoji
function generatePrompt({ movie }: FormValues): CreateCompletionRequest {
  const prompt = `Convert movie titles into emoji.

Back to the Future: 👨👴🚗🕒
Batman: 🤵🦇
Transformers: 🚗🤖
${movie}:`;

  return {
    model: 'text-davinci-002',
    prompt,
    max_tokens: 60,
    temperature: 0.8,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: '\n',
  };
}

export default function MovieToEmoji() {
  const form = useForm<FormValues>({
    initialValues: {
      movie: '',
    },
    validate: {
      movie: (value) => (value.length > 0 ? null : 'Invalid movie'),
    },
  });

  const [result, setResult] = React.useState<string | undefined>(undefined);
  const [openaiRequest, setOpenaiRequest] = React.useState<
  CreateCompletionRequest | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);

  return (
    <Box sx={{ maxWidth: 500 }}>
      <form onSubmit={
        form.onSubmit(async (values) => {
          const request = generatePrompt(values);
          setLoading(true);
          setOpenaiRequest(request);
          await fetch('/api/completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          }).then(
            async (response) => {
              const completion = await response.json() as CreateCompletionResponse;
              setResult(completion && completion.choices
                ? completion.choices[0].text
                : 'No result, check the logs.');
            },
          ).finally(() => {
            setLoading(false);
          });
        })
      }
      >
        <Stack spacing="xs">
          <TextInput
            withAsterisk
            label="Enter a movie title"
            placeholder="The Matrix"
            {...form.getInputProps('movie')}
          />
          <Button type="submit" loading={loading}>Generate!</Button>
          { (result && !loading)
          && (
            <>
              <Divider my="xs" />
              <Title order={4}>Result</Title>
              <Paper shadow="xs" p="md">
                <Text size={50} align="center">{ result }</Text>
              </Paper>
              <Title order={4}>GPT-3 Prompt</Title>
              <Paper shadow="xs" p="md">
                <Code block>
                  { openaiRequest?.prompt }

                  <Mark>{ result }</Mark>
                </Code>
              </Paper>
            </>
          )}
        </Stack>
      </form>
    </Box>
  );
}
