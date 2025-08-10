import {
    LinkedinScraper,
    relevanceFilter,
    timeFilter,
    typeFilter,
    experienceLevelFilter,
    onSiteOrRemoteFilter,
    baseSalaryFilter,
    events,
} from "linkedin-jobs-scraper";

(async () => {
    // Each scraper instance is associated with one browser.
    // Concurrent queries will run on different pages within the same browser instance.
    const scraper = new LinkedinScraper({
        headless: true,
        slowMo: 200, // 100ms for each concurrent query for rate limiting.
        args: [
            "--lang=en-US",
        ],
    });

    // Add listeners for scraper events

    // Emitted once for each processed job
    scraper.on(events.scraper.data, (data) => {
        console.log(
            data.description.length,
            data.descriptionHTML.length,
            `Query='${data.query}'`,
            `Location='${data.location}'`,
            `Id='${data.jobId}'`,
            `Title='${data.title}'`,
            `Company='${data.company ? data.company : "N/A"}'`,
            // `CompanyLink='${data.companyLink ? data.companyLink : "N/A"}'`,
            // `CompanyImgLink='${data.companyImgLink ? data.companyImgLink : "N/A"}'`,
            `Place='${data.place}'`,
            `Date='${data.date}'`,
            // `DateText='${data.dateText}'`,
            `Link='${data.link}'`,
            `applyLink='${data.applyLink ? data.applyLink : "N/A"}'`,
            `insights='${data.insights}'`,
        );
    });

    // Emitted once for each scraped page
    scraper.on(events.scraper.metrics, (metrics) => {
        console.log(`Processed=${metrics.processed}`, `Failed=${metrics.failed}`, `Missed=${metrics.missed}`);
    });

    scraper.on(events.scraper.error, (err) => {
        console.error(err);
    });

    scraper.on(events.scraper.end, () => {
        console.log('All done!');
    });

    // Custom function executed on browser side to extract job description [optional]
    const descriptionFn = () => {
        const description = document.querySelector<HTMLElement>(".jobs-description");
        return description ? description.innerText.replace(/[\s\n\r]+/g, " ").trim() : "N/A";
    }

    // Run queries concurrently
    await Promise.all([
        // Run queries serially
        scraper.run([
            {
                query: "Software Developer",
                options: {
                    locations: ["Canada"], // This will override global options ["Europe"]
                    filters: {
                        relevance: relevanceFilter.RECENT,
                        time: timeFilter.WEEK,
                        type: [typeFilter.PART_TIME, typeFilter.CONTRACT, typeFilter.TEMPORARY],
                        experience: [experienceLevelFilter.ENTRY_LEVEL, experienceLevelFilter.MID_SENIOR],
                        onSiteOrRemote: [onSiteOrRemoteFilter.REMOTE],
                    },
                    skills: true,
                    descriptionFn: descriptionFn,
                }
            },
        ], { // Global options, will be merged individually with each query options
            // locations: ["Europe"],
            optimize: true,
            limit: 33,
        }),
    ]);

    // Close browser
    await scraper.close();
})();

