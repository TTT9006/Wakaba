CREATE TABLE "Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "SeasonRank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "exp" INTEGER NOT NULL,
    "kamonType" TEXT NOT NULL,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenSummary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SeasonRank_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeasonRank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DailyExp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "testExp" INTEGER NOT NULL DEFAULT 0,
    "reviewExp" INTEGER NOT NULL DEFAULT 0,
    "grammarExp" INTEGER NOT NULL DEFAULT 0,
    "writingExp" INTEGER NOT NULL DEFAULT 0,
    "streakExp" INTEGER NOT NULL DEFAULT 0,
    "totalExp" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DailyExp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UserExpLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "referenceId" TEXT,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "SeasonRank_seasonId_userId_key" ON "SeasonRank"("seasonId", "userId");
CREATE INDEX "SeasonRank_seasonId_rank_idx" ON "SeasonRank"("seasonId", "rank");
CREATE INDEX "SeasonRank_userId_idx" ON "SeasonRank"("userId");

CREATE UNIQUE INDEX "DailyExp_userId_date_key" ON "DailyExp"("userId", "date");
CREATE INDEX "DailyExp_userId_date_idx" ON "DailyExp"("userId", "date");

CREATE INDEX "UserExpLog_userId_date_activityType_idx" ON "UserExpLog"("userId", "date", "activityType");
