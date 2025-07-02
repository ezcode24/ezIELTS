import React, { useState, useEffect } from 'react';
import { FiSave, FiEdit3, FiX } from 'react-icons/fi';

const NotesPanel = ({ note, onNoteChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempNote, setTempNote] = useState(note || '');

  useEffect(() => {
    setTempNote(note || '');
  }, [note]);

  const handleSave = () => {
    onNoteChange(tempNote);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempNote(note || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <FiEdit3 className="w-4 h-4 mr-2" />
          Notes
        </h4>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <FiSave className="w-4 h-4 mr-1" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center"
              >
                <FiX className="w-4 h-4 mr-1" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Take notes about this question..."
            className="input-field w-full h-32 resize-none"
            autoFocus
          />
          <div className="text-xs text-gray-500">
            Press Ctrl+Enter to save, or Escape to cancel
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[6rem]">
          {note ? (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">{note}</div>
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No notes yet. Click "Edit" to add notes about this question.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPanel; 