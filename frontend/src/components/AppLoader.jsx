import { motion } from "framer-motion";

export default function AppLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <motion.h1
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-2xl font-bold text-[var(--accent-color)]"
        >
          CurrentNews365
        </motion.h1>

        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              animate={{ height: [8, 24, 8] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-2 bg-[var(--accent-color)] rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
