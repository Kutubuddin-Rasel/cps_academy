import { errors } from "@strapi/utils";
import { isUnknownRecord } from "../../../utils/auth";

const { ValidationError } = errors;

type QuizOptionInput = {
  optionKey: string;
  text: string;
};

type QuizQuestionInput = {
  questionKey: string;
  prompt: string;
  options: QuizOptionInput[];
  correctOptionKey: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStableKey(value: unknown): value is string {
  return isNonEmptyString(value) && value === value.trim();
}

function validateOptions(
  value: unknown,
  questionNumber: number,
): QuizOptionInput[] {
  if (!Array.isArray(value) || value.length < 2) {
    throw new ValidationError(
      `Question ${questionNumber} must contain at least two Options.`,
    );
  }

  const optionKeys = new Set<string>();
  const options: QuizOptionInput[] = [];

  for (const [optionIndex, option] of value.entries()) {
    const optionNumber = optionIndex + 1;

    if (!isUnknownRecord(option)) {
      throw new ValidationError(
        `Option ${optionNumber} in Question ${questionNumber} must be an object.`,
      );
    }

    const { optionKey, text } = option;

    if (!isStableKey(optionKey)) {
      throw new ValidationError(
        `Option ${optionNumber} in Question ${questionNumber} must have a non-empty optionKey.`,
      );
    }

    if (optionKeys.has(optionKey)) {
      throw new ValidationError(
        `Option keys must be unique within Question ${questionNumber}.`,
      );
    }

    if (!isNonEmptyString(text)) {
      throw new ValidationError(
        `Option ${optionNumber} in Question ${questionNumber} must have non-empty text.`,
      );
    }

    optionKeys.add(optionKey);
    options.push({ optionKey, text });
  }

  return options;
}

export function validateQuizQuestions(value: unknown): QuizQuestionInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError("Quiz must contain at least one Question.");
  }

  const questionKeys = new Set<string>();
  const questions: QuizQuestionInput[] = [];

  for (const [questionIndex, question] of value.entries()) {
    const questionNumber = questionIndex + 1;

    if (!isUnknownRecord(question)) {
      throw new ValidationError(`Question ${questionNumber} must be an object.`);
    }

    const { questionKey, prompt, correctOptionKey } = question;

    if (!isStableKey(questionKey)) {
      throw new ValidationError(
        `Question ${questionNumber} must have a non-empty questionKey.`,
      );
    }

    if (questionKeys.has(questionKey)) {
      throw new ValidationError("Question keys must be unique within a Quiz.");
    }

    if (!isNonEmptyString(prompt)) {
      throw new ValidationError(
        `Question ${questionNumber} must have a non-empty prompt.`,
      );
    }

    const options = validateOptions(question.options, questionNumber);

    if (!isStableKey(correctOptionKey)) {
      throw new ValidationError(
        `Question ${questionNumber} must have a non-empty correctOptionKey.`,
      );
    }

    if (!options.some((option) => option.optionKey === correctOptionKey)) {
      throw new ValidationError(
        `Question ${questionNumber} correctOptionKey must match one of its optionKeys.`,
      );
    }

    questionKeys.add(questionKey);
    questions.push({
      questionKey,
      prompt,
      options,
      correctOptionKey,
    });
  }

  return questions;
}
