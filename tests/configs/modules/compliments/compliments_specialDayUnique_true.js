let config = {
    modules: [
        {
            module: "compliments",
            position: "middle_center",
            config: {
                updateInterval: 1000 * 5, // Update every 10 secs
                specialDayUnique: true,
                compliments: {
                    anytime: [
                        "Typical message 1",
                        "Typical message 2",
                        "Typical message 3"
                    ],
                    "....-..-..": [
                        "Special day message"
                    ]
                },
            },
        }
    ]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
