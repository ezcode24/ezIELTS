import React from 'react';
import { FiCheck, FiSquare, FiCircle } from 'react-icons/fi';

const QuestionRenderer = ({ question, answer, onAnswerChange }) => {
  if (!question) return null;

  const renderQuestionType = () => {
    switch (question.type) {
      case 'multiple-choice':
        return renderMultipleChoice();
      case 'true-false':
        return renderTrueFalse();
      case 'fill-blank':
        return renderFillBlank();
      case 'matching':
        return renderMatching();
      case 'short-answer':
        return renderShortAnswer();
      case 'essay':
        return renderEssay();
      case 'listening':
        return renderListening();
      case 'reading':
        return renderReading();
      default:
        return renderMultipleChoice();
    }
  };

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      {question.options?.map((option, index) => (
        <label
          key={index}
          className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
            answer === option.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name={`question-${question._id}`}
            value={option.value}
            checked={answer === option.value}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div className="flex-1">
            <span className="font-medium text-gray-900">{option.label}</span>
            {option.description && (
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="space-y-3">
      {[
        { value: 'true', label: 'True' },
        { value: 'false', label: 'False' }
      ].map((option) => (
        <label
          key={option.value}
          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
            answer === option.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name={`question-${question._id}`}
            value={option.value}
            checked={answer === option.value}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="font-medium text-gray-900">{option.label}</span>
        </label>
      ))}
    </div>
  );

  const renderFillBlank = () => (
    <div className="space-y-4">
      {question.blanks?.map((blank, index) => (
        <div key={index} className="flex items-center space-x-2">
          <span className="text-gray-700">{blank.prefix}</span>
          <input
            type="text"
            value={answer?.[index] || ''}
            onChange={(e) => {
              const newAnswer = Array.isArray(answer) ? [...answer] : [];
              newAnswer[index] = e.target.value;
              onAnswerChange(newAnswer);
            }}
            className="flex-1 input-field text-center"
            placeholder="Enter your answer"
          />
          <span className="text-gray-700">{blank.suffix}</span>
        </div>
      ))}
    </div>
  );

  const renderMatching = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Items to match */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Items</h4>
          <div className="space-y-2">
            {question.items?.map((item, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <span className="font-medium text-gray-900">{index + 1}.</span>
                <span className="ml-2 text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column - Options to match with */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Options</h4>
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <span className="font-medium text-gray-900">{String.fromCharCode(65 + index)}.</span>
                <span className="ml-2 text-gray-700">{option}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matching inputs */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Your Answers</h4>
        <div className="space-y-2">
          {question.items?.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="font-medium text-gray-900 w-8">{index + 1}.</span>
              <span className="text-gray-700 flex-1">{item}</span>
              <span className="text-gray-500">→</span>
              <select
                value={answer?.[index] || ''}
                onChange={(e) => {
                  const newAnswer = Array.isArray(answer) ? [...answer] : [];
                  newAnswer[index] = e.target.value;
                  onAnswerChange(newAnswer);
                }}
                className="input-field w-20"
              >
                <option value="">-</option>
                {question.options?.map((option, optIndex) => (
                  <option key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                    {String.fromCharCode(65 + optIndex)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderShortAnswer = () => (
    <div>
      <textarea
        value={answer || ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Enter your answer..."
        className="input-field w-full h-24 resize-none"
        maxLength={question.maxLength || 200}
      />
      {question.maxLength && (
        <div className="text-sm text-gray-500 mt-1 text-right">
          {(answer?.length || 0)} / {question.maxLength} characters
        </div>
      )}
    </div>
  );

  const renderEssay = () => (
    <div>
      <textarea
        value={answer || ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Write your essay here..."
        className="input-field w-full h-48 resize-none"
        maxLength={question.maxLength || 1000}
      />
      {question.maxLength && (
        <div className="text-sm text-gray-500 mt-1 text-right">
          {(answer?.length || 0)} / {question.maxLength} characters
        </div>
      )}
    </div>
  );

  const renderListening = () => (
    <div className="space-y-4">
      {question.audioUrl && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">
            Listen to the audio and answer the questions below.
          </p>
          <audio controls className="w-full">
            <source src={question.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      
      {question.subQuestions?.map((subQ, index) => (
        <div key={index} className="border-l-4 border-blue-200 pl-4">
          <p className="font-medium text-gray-900 mb-2">
            {index + 1}. {subQ.question}
          </p>
          {subQ.type === 'multiple-choice' ? (
            <div className="space-y-2">
              {subQ.options?.map((option, optIndex) => (
                <label
                  key={optIndex}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors duration-200 ${
                    answer?.[index] === option.value
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`subquestion-${question._id}-${index}`}
                    value={option.value}
                    checked={answer?.[index] === option.value}
                    onChange={(e) => {
                      const newAnswer = Array.isArray(answer) ? [...answer] : [];
                      newAnswer[index] = e.target.value;
                      onAnswerChange(newAnswer);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={answer?.[index] || ''}
              onChange={(e) => {
                const newAnswer = Array.isArray(answer) ? [...answer] : [];
                newAnswer[index] = e.target.value;
                onAnswerChange(newAnswer);
              }}
              className="input-field"
              placeholder="Enter your answer"
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderReading = () => (
    <div className="space-y-6">
      {/* Reading passage */}
      {question.passage && (
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: question.passage }} />
          </div>
        </div>
      )}

      {/* Questions */}
      {question.subQuestions?.map((subQ, index) => (
        <div key={index} className="border-l-4 border-green-200 pl-4">
          <p className="font-medium text-gray-900 mb-2">
            {index + 1}. {subQ.question}
          </p>
          {subQ.type === 'multiple-choice' ? (
            <div className="space-y-2">
              {subQ.options?.map((option, optIndex) => (
                <label
                  key={optIndex}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors duration-200 ${
                    answer?.[index] === option.value
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`subquestion-${question._id}-${index}`}
                    value={option.value}
                    checked={answer?.[index] === option.value}
                    onChange={(e) => {
                      const newAnswer = Array.isArray(answer) ? [...answer] : [];
                      newAnswer[index] = e.target.value;
                      onAnswerChange(newAnswer);
                    }}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={answer?.[index] || ''}
              onChange={(e) => {
                const newAnswer = Array.isArray(answer) ? [...answer] : [];
                newAnswer[index] = e.target.value;
                onAnswerChange(newAnswer);
              }}
              className="input-field"
              placeholder="Enter your answer"
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {question.text}
        </h3>
        
        {/* Question instructions */}
        {question.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> {question.instructions}
            </p>
          </div>
        )}

        {/* Question image */}
        {question.imageUrl && (
          <div className="mb-4">
            <img
              src={question.imageUrl}
              alt="Question"
              className="max-w-full h-auto rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Answer options */}
      <div>
        {renderQuestionType()}
      </div>

      {/* Question metadata */}
      {question.points && (
        <div className="text-sm text-gray-500">
          Points: {question.points}
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer; 