---
layout: "../layouts/BlogPost.astro"
title: "Understand how BabyAGI works"
slug: understand-how-babyagi-works
description: ""
added: "Apr 23 2023"
tags: [AI]
---

## BabyAGI User Guide
Autonomous AI agents run on a loop to generate self-directed instructions and actions at each iteration. [BabyAGI JS](https://github.com/ericciarla/babyagijs) is a JavaScript-based AI agent that can generate and pretend to execute tasks based on a given objective. This post helps you to understand how it works by reading its source code.

The key feature of BabyAGI is just three agents: Task Execution Agent, Task Creation Agent, and Task Prioritization Agent.

1. The **Task Execution Agent** completes the first task from the task list and returns results.
2. The **Task Creation Agent** creates new tasks based on the objective and result of the previous task.
3. The **Task Prioritization Agent** then reorders the tasks according to their importance and relevance to the main objective.

And then this simple process gets repeated over and over.

> In a LangChain webinar, [Yohei Nakajima](https://yoheinakajima.com/task-driven-autonomous-agent-utilizing-gpt-4-pinecone-and-langchain-for-diverse-applications/) mentioned that designed BabyAGI in a way to emulate how he works. Specifically, he starts each morning by tackling the first item on his to-do list and then works through his tasks. If a new task arises, he simply adds it to his list. At the end of the day, he reevaluates and reprioritizes his list. This same approach was then mapped onto the agent.

## Define the Chains
BabyAGI is easy to run within the LangChain framework. It basically creates a BabyAGI controller which composes of three chains TaskCreationChain, TaskPrioritizationChain, and ExecutionChain, and runs them in a (potentially-)infinite loop.

```js
import { LLMChain, PromptTemplate } from "langchain";
import { BaseChatModel } from "langchain/chat_models";

class TaskCreationChain extends LLMChain {
  constructor(prompt: PromptTemplate, llm: BaseChatModel) {
    super({prompt, llm});
  }

  static from_llm(llm: BaseChatModel): LLMChain {
    const taskCreationTemplate: string =
      "You are a task creation AI that uses the result of an execution agent" +
      " to create new tasks with the following objective: {objective}," +
      " The last completed task has the result: {result}." +
      " This result was based on this task description: {task_description}." +
      " These are incomplete tasks list: {incomplete_tasks}." +
      " Based on the result, create new tasks to be completed" +
      " by the AI system that do not overlap with incomplete tasks." +
      " Return the tasks as an array.";

    const prompt = new PromptTemplate({
      template: taskCreationTemplate,
      inputVariables: ["result", "task_description", "incomplete_tasks", "objective"],
    });

    return new TaskCreationChain(prompt, llm);
  }
}
```

```js
class TaskPrioritizationChain extends LLMChain {
  constructor(prompt: PromptTemplate, llm: BaseChatModel) {
    super({ prompt, llm});
  }

  static from_llm(llm: BaseChatModel): TaskPrioritizationChain {
    const taskPrioritizationTemplate: string = (
      "You are a task prioritization AI tasked with cleaning the formatting of and reprioritizing" +
      " the following task list: {task_names}." +
      " Consider the ultimate objective of your team: {objective}." +
      " Do not remove any tasks. Return the result as a numbered list, like:" +
      " #. First task" +
      " #. Second task" +
      " Start the task list with number {next_task_id}."
    );
    const prompt = new PromptTemplate({
      template: taskPrioritizationTemplate,
      inputVariables: ["task_names", "next_task_id", "objective"],
    });
    return new TaskPrioritizationChain(prompt, llm);
  }
}
```

```js
class ExecutionChain extends LLMChain {
  constructor(prompt: PromptTemplate, llm: BaseChatModel) {
    super({prompt, llm});
  }

  static from_llm(llm: BaseChatModel): LLMChain {
    const executionTemplate: string =
      "You are an AI who performs one task based on the following objective: {objective}." +
      " Take into account these previously completed task list: {context}." +
      " Your task: {task}." +
      " Respond with how you would complete this task:";

    const prompt = new PromptTemplate({
      template: executionTemplate,
      inputVariables: ["objective", "context", "task"],
    });

    return new ExecutionChain(prompt, llm);
  }
}
```

## Define the BabyAGI Controller

**getNextTask()**
```js
const incompleteTasks: string = taskList.join(", ");
// predict(**kwargs: Any) → str
// Format prompt with kwargs and pass to LLM, returns the Completion from LLM.
const response: string = await taskCreationChain.predict({
  result,
  task_description: taskDescription,
  incomplete_tasks: incompleteTasks,
  objective,
});
```

**prioritizeTasks()**
```js
const next_task_id = thisTaskId + 1;
const task_names = taskList.map(t => t.task_name).join(', ');
const response = await taskPrioritizationChain.predict({ task_names, next_task_id, objective });
```

**executeTask()**
```js
const context = doneTasks.join(', ');
return executionChain.predict({objective, context, task});
```

**BabyAGI class**
```js
export class BabyAGI {
  taskList: Array<Task> = [];
  taskCreationChain: TaskCreationChain;
  taskPrioritizationChain: TaskPrioritizationChain;
  executionChain: ExecutionChain;

  taskIdCounter = 1;
  // Define the max iterations, so that it doesn’t run forever,
  // and spend all the money on OpenAI API.
  maxIterations = 3;

  constructor(taskCreationChain: TaskCreationChain, taskPrioritizationChain: TaskPrioritizationChain, executionChain: ExecutionChain, ) {
    this.taskCreationChain = taskCreationChain;
    this.taskPrioritizationChain = taskPrioritizationChain;
    this.executionChain = executionChain;
  }

  addTask(task: Task) {
    this.taskList.push(task);
  }

  async call(inputs: Record<string, any>): Promise<Record<string, any>> {
    const { objective } = inputs;
    const firstTask = inputs.first_task || 'Make a todo list';
    this.addTask({ task_id: 1, task_name: firstTask });
    
    let numIters = 0;
    let loop = true;
    const doneTasks = [];

    while (loop) {
      if (this.taskList.length) {
        // Step 1: Pull the first task
        const task = this.taskList.shift();
        // Step 2: Execute the task
        const result = await executeTask(this.executionChain, objective, task.task_name, doneTasks);
        doneTasks.push(task.task_name);
        const thisTaskId = task.task_id;

        // (Optional) Step 3: Store the result in Pinecone

        // Step 4: Create new tasks and reprioritize task list
        const newTasks = await getNextTask(this.taskCreationChain, result, task.task_name, this.taskList.map(t => t.task_name), objective);
        
        newTasks.forEach(newTask => {
          this.taskIdCounter += 1;
          newTask.task_id = this.taskIdCounter;
          this.addTask(newTask);
        });
      
        this.taskList = await prioritizeTasks(this.taskPrioritizationChain, thisTaskId, this.taskList, objective);
      }

      numIters += 1;
      if (this.maxIterations !== null && numIters === this.maxIterations) {
        console.log('*****TASK ENDING*****');  
        loop = false;
      }
    }

    return {};
  }

  static fromLLM(llm: BaseChatModel): BabyAGI {
    const taskCreationChain = TaskCreationChain.from_llm(llm);
    const taskPrioritizationChain = TaskPrioritizationChain.from_llm(llm);
    const executionChain = ExecutionChain.from_llm(llm);

    return new BabyAGI(taskCreationChain, taskPrioritizationChain, executionChain);
  }
}
```

## Run the BabyAGI
Now it’s time to create the BabyAGI controller and watch it try to accomplish your objective.

```js
import { ChatOpenAI } from "langchain/chat_models";

const OBJECTIVE = 'Write a weather report for SF today';
const llm = new ChatOpenAI({ temperature: 0 });
const babyAgi = BabyAGI.fromLLM(llm);

babyAgi.call({ objective: OBJECTIVE });
```

## References
- https://github.com/ericciarla/babyagijs
- https://github.com/yoheinakajima/babyagi
- https://python.langchain.com/en/latest/use_cases/agents/baby_agi.html
