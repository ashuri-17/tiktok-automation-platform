export default function Test() {
  const handleClick = () => {
    console.log('Button clicked!');
    alert('Button works!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!');
    alert('Form works!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Test Page</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Test 1: Direct Button Click</h2>
          <button
            onClick={handleClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Click Me
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Test 2: Form Submission</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter something"
              className="w-full bg-slate-700 text-white px-4 py-2 rounded mb-4"
            />
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Submit Form
            </button>
          </form>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Test 3: Console Check</h2>
          <button
            onClick={() => {
              console.log('Console test - check browser console');
              console.log('Window object:', typeof window);
              console.log('Document object:', typeof document);
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Check Console
          </button>
        </div>
      </div>
    </div>
  );
}
