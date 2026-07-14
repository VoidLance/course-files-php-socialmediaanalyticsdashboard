<?php

declare(strict_types=1);
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Social Media Analytics Dashboard Launcher</title>
    <style>
        body {
            margin: 1.25rem;
            font-family: "Courier New", Courier, monospace;
            line-height: 1.4;
            color: #111;
            background: #fff;
        }

        h1 {
            margin-top: 0;
            margin-bottom: 0.3rem;
            font-size: 1.25rem;
        }

        p {
            margin: 0.35rem 0;
        }

        ul {
            margin-top: 0.5rem;
            padding-left: 1rem;
        }

        li {
            margin: 0.25rem 0;
        }

        a {
            color: #0033aa;
            text-decoration: underline;
        }

        .hint {
            margin-top: 0.8rem;
            padding: 0.55rem 0.65rem;
            border: 1px solid #ccc;
            background: #f7f7f7;
        }

        code {
            background: #f7f7f7;
            border: 1px solid #ccc;
            padding: 0.05rem 0.2rem;
        }
    </style>
</head>
<body>
    <h1>Project 5 Launcher</h1>
    <p>Social Media Analytics Dashboard quick launch page.</p>

    <ul>
        <li><a href="frontend/index.html">Frontend entry file (Vite source)</a></li>
        <li><a href="backend/public/index.php">Backend entry file</a></li>
        <li><a href="backend/public/index.php?v=1">Backend entry with cache-busting query</a></li>
        <li><a href="README.md">Project README</a></li>
    </ul>

    <div class="hint">
        <strong>Frontend note:</strong> <code>frontend/index.html</code> is a Vite development entrypoint.
        For a working React UI, run <code>npm install</code> and <code>npm run dev</code> in
        <code>SocialMediaAnalyticsDashboard/frontend</code>, then open <code>http://localhost:5173</code>.
    </div>
</body>
</html>
