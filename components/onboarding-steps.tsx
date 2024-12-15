import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  
import { Checkbox } from "@/components/ui/checkbox"
type BasicInfoStepProps = {
    fullName: string
    occupation: string
    onInputChange: (key: "fullName" | "occupation", value: string) => void
    }

export const BasicInfoStep = ({ fullName, occupation, onInputChange }:BasicInfoStepProps) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="fullName">Full Name</Label>
      <Input
        id="fullName"
        value={fullName}
        onChange={(e) => onInputChange("fullName", e.target.value)}
        required
      />
    </div>
    <div>
      <Label htmlFor="occupation">Occupation</Label>
      <Input
        id="occupation"
        value={occupation}
        onChange={(e) => onInputChange("occupation", e.target.value)}
        required
      />
    </div>
  </div>
)

type EducationStepProps = {
    degree: string
    favoriteSubject: string
    onInputChange: (key: "degree" | "favoriteSubject", value: string) => void
    }

export const EducationStep = ({ degree, favoriteSubject, onInputChange }:EducationStepProps) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="degree">Highest Degree</Label>
      <Select
        defaultValue={degree}
        onValueChange={(value) => onInputChange("degree", value as string)}
        >
        <SelectTrigger>
          <SelectValue placeholder="Select Degree" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="None">None</SelectItem>
          <SelectItem value="High School">High School</SelectItem>
            <SelectItem value="Associate's Degree">Associate's Degree</SelectItem>
          <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
          <SelectItem value="Master's Degree">Master's Degree</SelectItem>
          <SelectItem value="PhD">PhD</SelectItem>
        </SelectContent>
        </Select>
    </div>
    <div>
      <Label htmlFor="favoriteSubject">Favorite Subject</Label>
      <Input
        id="favoriteSubject"
        value={favoriteSubject}
        onChange={(e) => onInputChange("favoriteSubject", e.target.value)}
        required
      />
    </div>
  </div>
)

const interestOptions = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Literature",
  "History",
  "Art",
  "Music",
  "Psychology",
]
type InterestsStepProps = {
    interests: string[]
    onInputChange: (key: "interests", value: string[]) => void
    }
export const InterestsStep = ({ interests, onInputChange }:InterestsStepProps) => (
  <div className="space-y-4">
    <Label>Select Your Interests</Label>
    {interestOptions.map((interest) => (
      <div key={interest} className="flex items-center space-x-2">
        <Checkbox
          id={interest}
          checked={interests.includes(interest)}
          onCheckedChange={(checked) => {
            if (checked) {
              onInputChange("interests", [...interests, interest])
            } else {
              onInputChange("interests", interests.filter((i:string) => i !== interest))
            }
          }}
        />
        <label htmlFor={interest}>{interest}</label>
      </div>
    ))}
  </div>
)

