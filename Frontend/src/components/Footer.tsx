

const Footer = () => {
  return (
    <footer className="w-full text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
      <p>&copy; {new Date().getFullYear()} BrainBox. All rights reserved. | <a href="https://github.com/gemini-testing/brainbox" target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a></p>
    </footer>
  );
};

export default Footer;