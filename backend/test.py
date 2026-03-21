from youtube_transcript_api import YouTubeTranscriptApi
import traceback

def main():
    with open("c:\\dev\\hackthon\\ArtForge\\SkillForge\\backend\\test_out.txt", "w") as f:
        f.write("DIR of YouTubeTranscriptApi:\n")
        f.write(str(dir(YouTubeTranscriptApi)))
        f.write("\nAttempting to call get_transcript:\n")
        try:
            t = YouTubeTranscriptApi.get_transcript("U2ppEzBaMck")
            f.write("Success! " + str(len(t)) + "\n")
        except Exception as e:
            f.write("Error: " + str(type(e)) + "\n")
            f.write(str(e))

if __name__ == "__main__":
    main()
