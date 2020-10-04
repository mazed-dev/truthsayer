 Faster code review

Code review thankfully became a common practice these days. As software engineers we all likely do it every day. But whether we enjoy doing it is a big question. Many of us do it as taking a bitter but necessary medicine. It requires a significant amount of time, it is tedious and most of all thankless. Because of that, review of our own code is usually very slow. To get it done, we poke colleges over and over again, annoy them with regular and rather pleading messages. By the end we lose all the hope to have it merged.

Over the time I worked out a few tips that help to get diffs reviewed faster, with fewer iterations and questions. I gathered them here in a hope they could be useful for somebody else.

 Tests

The main requirement to any code is it has to be correct. It has to do exactly what is expected. And any good reviewer wants to verify that code in a “diff” is correct. But obviously they can not spend as much time on understanding the implementation as I did writing one. The good way to free them from doing it is to create tests. Not just some tests, but rather simple and comprehensive ones. Therefore reviewers can only verify test cases to check that change is correct.

 Description

To review the code my teammates need to understand what my change is about. They may not have the full context or not see the connection to the project that I am working on. I can help them by providing enough details and links in the description. I usually split this into 4 parts:

1. What has been changed. This is a high level description of the change from the perspective of requirements: task, design document, project plan. It's quite important to add links to those documents.
2. Why it has to be changed. Understanding the reasoning behind the change is necessary for good code review, especially for those people who’s projects depend on changed one. Why is this change necessary? Which further changes do depend on it? Why does this change have to be made now?
3. How it has been changed. This is a brief description of the logic to help to understand actual implementation. How does the changed code suppose to work? What is the difference with the version before the change? It also could be a list of used frameworks, design patterns, algorithms, libraries etc. It's better to leave references to documentation, wiki pages, articles and any other used sources.
4. When this change will be shipped and why it is safe to do. It is a place to talk about:
    Backward compatibility.
       Roll out plan.
          Migration and adoption plans.
             Monitoring metrics to see that feature is enabled correctly and everything works as expected.
                Emergency plan if something goes wrong: killswitches, roll back plan.

               It's better to have documentation separately and leave the links to it here, to avoid duplication and to save some time for those who are fully aware of the project.

                Title

               Perhaps a title is not a main part of the change, but it's the first one that reviewers see in theirs’ inbox. Title essentially is an advertisement for the diff. The piece of text that has to catch reviewers attention, make them curious. They should want to click on it and read further. I have few practical tips to make the title a bit more appealing:

                Mention a product/module/library to which change is made. That would prepare readers what part of the codebase they will see changed.
                Mention a project that this "diff" belongs to. If readers are already familiar with a design document, they would feel much more comfortable to open the “diff”. If they are not, a new name would make them curious.
                Make it brief and clear, no more than 68 words. We are all people of modern times with annoying commercials everywhere, instant messages and Twitter. So long headers bore us to death and we likely skip them. Also if an author could not come up with a good name what they should expect from the “diff” quality?

                Size

               Even if reviewers open my change the lengthy description or huge number of changed files would scare them away. They will promise to come back later, when they have more spare time. Which is unlikely. We all do this, let's be honest.

               To increase chances that reviewers actually read my "diffs" it’s better to keep them neat and small. Here are the practical cases when I would rather split a diff into smaller ones.
                
                Separate diffs introducing important change to an interface or new interface of the service, class, framework. It's particularly difficult to propose such changes and get agreement within stakeholders. But only modification of the interface is a hottest topic, not the implementation behind it. So submitting them separately would likely reduce review time.

                Integration tests tends to be lengthy and intricate, that's the ugly truth about them. Introducing them with a functional change would guarantee an enormous increase in “diff” complexity. In addition functional change can get lost in a mass of testing code and very likely get overlooked. So submit integration tests or any other extensive testing separately from the functional changes.

                New class or function are reviewed faster and with less iterations in individual "diffs".

                Isolate changes in different languages to individual diffs, simply language per "diff". Usually, engineers know multiple languages, they can read the code in them and even do small changes. But they have mastered only a few of them, truly like and enjoy working with. So let them choose a language to read and have fun.

                Examples, as a part of documentation and testing, are important enough to be reviewed, so they deserve a separate "diff". Reviewing them requires a different set of skills and context. And it’s quite likely the group of stakeholders is not the same as for the implementation.

                If I struggle to make the title short and clear, or if description swells enormously, or if what section of the description is rather a list of things, that also means I should split the “diff”.


                And the last one, I always ask myself how quickly I would be able to review the “diff”, multiply it by bias factor (25). If the estimated time is more than 5 minutes, this is a good reason to split “diff” even more.

                 Comments

                Perhaps this is the hottest thing about all code reviews. It's too easy to become defensive or indiscreet.

                How often do we find ourselves in the middle of yet another “holy war” in the comments of pull request? How often do we feel hopelessly blocked by impractical arguments?

                There are plenty of recommendations of how to avoid such cases. I'd like to mention just one here. It’s the main one, I believe.

                The feedback to my diffs are rather recommendations, not demands. I can ignore them, defend every piece of my work to death and merge “diff” with no change. But it will be me, who is responsible for an outage caused by my work at the end.

                If the company, where I work, practices regular performance reviews, such an outage very likely will affect my evaluation. It will appear in peer reviews, especially in a feedback of that poor person who was oncall at the time. It will appear in the report of my manager for sure. It will affect the size of the bonus after all.

                Therewith it will affect my reputation as an engineer. It is ok to make mistakes from time to time, but if there is a pattern emerging it will become a trait of mine. Who would trust me after that?

                Comments under the diff is a great opportunity to reveal weak spots in my solution with a generous help of reviewers. It's better to listen to commentaries and use them to improve the solution. It's also important to thank reviewers for their time and effort to encourage them to keep reviewing my code.

                 Checklist

                As a practical application I keep a checklist of 4 points to verify my diffs before pressing the "submit".

                 Is provided testing enough to verify that the code is correct?
                 Does diff description answer basic questions: what, why, how, when?
                 Is the title short and clear enough?
                 Would 5 minutes be enough for an average person in the team to review the code?

                The main idea of these tips is to make the review process less painful for you team mates. Following these tips, would relieve reviewers from deep understanding of the solution, but rather verify test cases. It would save them some time guessing the context and asking trivial questions. They will be able to easily review your diff at a short break between meetings, because it takes them no more than 5 minutes. They will hesitate less before opening your diff next time, because you listen to theirs opinion and thank them for it. This is a winwin situation for all of you, they suffer less working with your diffs, you are able to deliver a better quality product and to be a better engineer.

