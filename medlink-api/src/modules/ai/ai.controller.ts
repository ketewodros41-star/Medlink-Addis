import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AiService } from "./ai.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("scribe")
  generateSoapDraft(@Body("complaint") complaint: string, @Body("transcript") transcript: string) {
    return this.aiService.generateSoapDraft(complaint, transcript);
  }

  @Post("explain-rx")
  explainPrescription(@Body("drugName") drugName: string, @Body("sig") sig: string) {
    return this.aiService.explainPrescription(drugName, sig);
  }

  @Post("interpret-lab")
  interpretLabResult(@Body("testName") testName: string, @Body("result") result: string) {
    return this.aiService.interpretLabResult(testName, result);
  }

  @Post("drug-interaction")
  checkDrugInteractions(@Body("drugs") drugs: string[]) {
    return this.aiService.checkDrugInteractions(drugs);
  }
}
