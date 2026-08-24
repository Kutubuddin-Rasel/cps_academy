import type { Schema, Struct } from '@strapi/strapi';

export interface QuizOption extends Struct.ComponentSchema {
  collectionName: 'components_quiz_options';
  info: {
    displayName: 'Option';
  };
  attributes: {
    optionKey: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface QuizQuestion extends Struct.ComponentSchema {
  collectionName: 'components_quiz_questions';
  info: {
    displayName: 'Question';
  };
  attributes: {
    correctOptionKey: Schema.Attribute.String & Schema.Attribute.Required;
    options: Schema.Attribute.Component<'quiz.option', true>;
    prompt: Schema.Attribute.Text & Schema.Attribute.Required;
    questionKey: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'quiz.option': QuizOption;
      'quiz.question': QuizQuestion;
    }
  }
}
