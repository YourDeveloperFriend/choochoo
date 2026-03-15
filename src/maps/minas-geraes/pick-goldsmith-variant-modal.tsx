import {useState} from "react";
import {
    Accordion,
    AccordionContent,
    AccordionTitle,
    Button,
    Header,
    Menu,
    MenuItem, Modal, ModalActions,
    ModalContent,
} from "semantic-ui-react";
import {useAction} from "../../client/services/action";
import {MiningToMoneyAction} from "./mining";
import {
    GOLDSMITH_VARIANT_BONUS_INCOME,
    GOLDSMITH_VARIANT_NO_MINING_EXPERTISE,
    MinasGeraesPickGoldsmithVariantAction,
    PickGoldsmithVariantData
} from "./action_selection";
import {Coordinates} from "../../utils/coordinates";

export function PickGoldsmithVariantModal() {
    const { emit, canEmit, isPending } = useAction(MinasGeraesPickGoldsmithVariantAction)
    if (!canEmit) {
        return <></>
    }

    return (
        <Modal open={true}>
            <Header>Perform Instant Production</Header>
            <ModalContent>
                <p>Pick the benefit for Goldsmith:</p>
                <p>
                    <Button primary onClick={() => emit({goldsmithVariant: GOLDSMITH_VARIANT_NO_MINING_EXPERTISE})}>
                        Deliver gold without spending mining expertise
                    </Button>
                </p>
                <p>
                    <Button secondary onClick={() => emit({goldsmithVariant: GOLDSMITH_VARIANT_BONUS_INCOME})}>
                        Receive one additional income for each gold delivered this round
                    </Button>
                </p>
            </ModalContent>
        </Modal>
    );
}
