import { useState } from 'react';
import { ServerConfigSchema, ConfigField, validateConfigField } from '../../../types/mcp-config';

interface MultiFieldConfigModalProps {
  schema: ServerConfigSchema;
  onSave: (config: Record<string, string>) => Promise<void>;
  onClose: () => void;
}

export function MultiFieldConfigModal({ schema, onSave, onClose }: MultiFieldConfigModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    schema.fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    schema.fields.forEach(field => {
      const validation = validateConfigField(field, values[field.key]);
      if (!validation.valid && validation.error) {
        newErrors[field.key] = validation.error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      alert(`保存エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: ConfigField) => {
    const commonClasses = "w-full px-4 py-2.5 bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2";
    const errorClasses = errors[field.key]
      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200";

    if (field.type === 'textarea') {
      return (
        <textarea
          value={values[field.key]}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={`${commonClasses} ${errorClasses} font-mono text-sm resize-none`}
          disabled={isSaving}
        />
      );
    }

    return (
      <input
        type={field.type === 'password' ? 'password' : 'text'}
        value={values[field.key]}
        onChange={(e) => handleChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        className={`${commonClasses} ${errorClasses} ${field.type === 'password' ? 'font-mono' : ''}`}
        disabled={isSaving}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{schema.name} 設定</h2>
            <p className="text-sm text-gray-600 mt-1">
              {schema.configType === 'multiple' && `${schema.fields.length}個の設定項目`}
              {schema.configType === 'connection_string' && '接続文字列の設定'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {schema.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                  {field.type === 'password' && values[field.key] && (
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(field.key) as HTMLInputElement;
                        if (input) {
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      表示切替
                    </button>
                  )}
                </div>
                <div id={field.key}>
                  {renderField(field)}
                </div>
              </label>

              {/* Help text */}
              {field.helpText && (
                <p className="text-xs text-gray-500 flex items-start">
                  <i className="ri-information-line mr-1 mt-0.5 flex-shrink-0"></i>
                  <span>{field.helpText}</span>
                </p>
              )}

              {/* Error message */}
              {errors[field.key] && (
                <p className="text-xs text-red-600 flex items-start">
                  <i className="ri-error-warning-line mr-1 mt-0.5 flex-shrink-0"></i>
                  <span>{errors[field.key]}</span>
                </p>
              )}
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSaving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  保存中...
                </>
              ) : (
                <>
                  <i className="ri-save-line"></i>
                  保存してGateway再起動
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
