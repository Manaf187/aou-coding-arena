
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Base temp directory on the HOST machine
const TEMP_BASE = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_BASE)) fs.mkdirSync(TEMP_BASE);

/**
 * EXECUTION QUEUE SYSTEM
 * Prevents server crash by limiting concurrent Docker containers.
 */
const MAX_CONCURRENT_JOBS = 4; // Adjust based on server CPU cores
const jobQueue = [];
let activeJobs = 0;

/**
 * Adds a job to the queue and triggers processing.
 */
const runCode = (language, code, input) => {
    return new Promise((resolve, reject) => {
        jobQueue.push({ language, code, input, resolve, reject });
        processQueue();
    });
};

/**
 * Returns current queue statistics for monitoring
 */
const getQueueStats = () => {
    return {
        active: activeJobs,
        queued: jobQueue.length,
        limit: MAX_CONCURRENT_JOBS
    };
};

/**
 * Processes the queue based on concurrency limit.
 */
const processQueue = () => {
    if (activeJobs >= MAX_CONCURRENT_JOBS || jobQueue.length === 0) return;

    // Take next job
    const job = jobQueue.shift();
    activeJobs++;

    // Execute logic
    executeDockerJob(job.language, job.code, job.input)
        .then(job.resolve)
        .catch(job.reject)
        .finally(() => {
            activeJobs--;
            processQueue(); // Trigger next job
        });
};

/**
 * Helper to delete directory recursively
 */
const cleanup = (dir) => {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
        console.error(`Failed to cleanup ${dir}:`, e.message);
    }
};

/**
 * Extract Java class name or default to 'Main'
 */
const getJavaClassName = (code) => {
    const match = code.match(/public\s+class\s+(\w+)/);
    return match ? match[1] : 'Main';
};

/**
 * Actual Docker Execution Logic
 */
const executeDockerJob = (language, code, input) => {
  return new Promise((resolve, reject) => {
    const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const jobDir = path.join(TEMP_BASE, jobId);

    // Docker requires absolute paths for volume mounting.
    let absoluteJobDir = path.resolve(jobDir);

    // FIX FOR WINDOWS: Docker Desktop often requires forward slashes for volume mounting
    if (process.platform === 'win32') {
        absoluteJobDir = absoluteJobDir.replace(/\\/g, '/');
    }

    // 1. Create Isolated Directory on Host
    try {
        fs.mkdirSync(jobDir);
    } catch (e) {
        return resolve({ status: 'System Error', output: 'Failed to create execution workspace.' });
    }

    console.log(`[EXECUTE] Processing Job: ${jobId} (${language}). Active: ${activeJobs}, Queue: ${jobQueue.length}`);

    let fileName;
    let shellCommand;

    try {
        // 2. Prepare File & Command
        if (language === 'python') {
            fileName = 'main.py';
            shellCommand = 'python3 main.py';
        } 
        else if (language === 'javascript') {
            fileName = 'index.js';
            shellCommand = 'node index.js';
        }
        else if (language === 'java') {
            const className = getJavaClassName(code);
            fileName = `${className}.java`;
            // Compile then Run
            shellCommand = `javac ${fileName} && java ${className}`;
        }
        else if (language === 'cpp') {
            fileName = 'main.cpp';
            // Compile then Run
            shellCommand = `g++ -o main main.cpp && ./main`;
        }
        else {
            throw new Error("Unsupported Language");
        }

        // Write the student's code to the host directory
        fs.writeFileSync(path.join(jobDir, fileName), code);

        // 3. Construct Docker Command
        const dockerArgs = [
            'run',
            '--rm',                  // Automatically remove container when done
            '-i',                    // Interactive (keep STDIN open for input)
            '--network', 'none',     // SECURITY: No internet access
            '--memory', '256m',      // SECURITY: Max 256MB RAM
            '--cpus', '1.0',         // SECURITY: Max 1 CPU core
            '-v', `${absoluteJobDir}:/app`, // Volume Mount: Host -> Container
            '-w', '/app',            // Working Directory inside container
            'aou-runner',            // Image Name
            'sh', '-c', shellCommand // Execute the command
        ];

        // 4. Spawn Docker Process
        const child = spawn('docker', dockerArgs);
        
        let stdout = '';
        let stderr = '';
        let hasError = false;

        // Hard Timeout (5 seconds)
        const timeout = setTimeout(() => {
            child.kill();
            hasError = true;
            cleanup(jobDir);
            resolve({ status: 'Runtime Error', output: 'Time Limit Exceeded (5s)' });
        }, 5000);

        // Handle Input (stdin)
        if (input) {
            child.stdin.write(input.toString()); // Ensure string
            child.stdin.end();
        } else {
            child.stdin.end();
        }

        // Capture Output
        child.stdout.on('data', (data) => stdout += data.toString());
        child.stderr.on('data', (data) => stderr += data.toString());

        child.on('error', (err) => {
            clearTimeout(timeout);
            hasError = true;
            cleanup(jobDir);
            resolve({ 
                status: 'Execution Error', 
                output: `Failed to launch Docker.\n1. Is Docker Desktop running?\n2. Did you build the image? (cd backend && docker build -t aou-runner .)\n\nDetails: ${err.message}` 
            });
        });

        child.on('close', (code) => {
            clearTimeout(timeout);
            if (hasError) return;
            cleanup(jobDir);

            if (code !== 0) {
                // If execution failed, usually stderr has the details (tracebacks, compiler errors)
                resolve({ status: 'Runtime Error', output: stderr || stdout || `Process exited with code ${code}` });
            } else {
                resolve({ status: 'Success', output: stdout.trim() });
            }
        });

    } catch (e) {
        cleanup(jobDir);
        resolve({ status: 'System Error', output: e.message });
    }
  });
};

module.exports = { runCode, getQueueStats };
